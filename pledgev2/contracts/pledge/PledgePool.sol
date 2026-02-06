// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../library/SafeTransfer.sol";
import "../interface/IDebtToken.sol";
import "../interface/IBscPledgeOracle.sol";
import "../interface/IUniswapV2Router02.sol";
import "../multiSignature/multiSignatureClient.sol";

contract PledgePool is ReentrancyGuard, SafeTransfer, multiSignatureClient {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    // 默认精度
    uint256 internal constant calDecimal = 1e18;
    // 基于手续费和利息的精度 (8位)
    uint256 internal constant baseDecimal = 1e8;
    // 最小存款金额限制 (100 * 1e18)
    uint256 public minAmount = 100e18;
    // 一年的秒数，用于计算年化利率
    uint256 constant baseYear = 365 days;

    // 池子的状态枚举
    // MATCH: 匹配阶段，允许存款和借款
    // EXECUTION: 执行阶段，已结算，正在计息
    // FINISH: 完成阶段，正常结束，允许还款和提现
    // LIQUIDATION: 清算阶段，发生违约，执行清算流程
    // UNDONE: 未完成阶段（比如募集失败），允许退款
    enum PoolState {
        MATCH,
        EXECUTION,
        FINISH,
        LIQUIDATION,
        UNDONE
    }
    PoolState constant defaultChoice = PoolState.MATCH;

    // 全局暂停开关
    bool public globalPaused = false;
    // Swap 路由地址 (这是 PancakeSwap 或类似 DEX 的路由，用于清算时变卖资产)
    address public swapRouter;
    // 收取费用的地址
    address payable public feeAddress;
    // 预言机地址 (用于获取资产价格，计算质押率)
    IBscPledgeOracle public oracle;
    // 费用 (基数为 1e8)
    uint256 public lendFee; // 借款费率
    uint256 public borrowFee; // 贷款费率

    // 每个池的基本信息结构体
    struct PoolBaseInfo {
        uint256 settleTime; // 结算时间 (在这个时间点，必须要从 MATCH 转变为 EXECUTION)
        uint256 endTime; // 结束时间 (合约到期时间，到期后可以还款取回抵押品)
        uint256 interestRate; // 池的固定年化利率，单位是1e8 (例如 5000000 代表 5%)
        uint256 maxSupply; // 池的最大募集限额 (存款硬顶)
        uint256 lendSupply; // 当前实际存款总额 (Lender 存入的资金)
        uint256 borrowSupply; // 当前实际抵押总额 (Borrower 存入的抵押品)
        uint256 martgageRate; // 池的抵押率，单位是1e8 (例如 200000000 代表 200% 超额抵押)
        address lendToken; // 借出代币地址 (例如 USDT, BUSD 等稳定币)
        address borrowToken; // 抵押代币地址 (例如 BTC, ETH 等波动资产)
        PoolState state; // 当前池子的状态
        IDebtToken spCoin; // 存款人凭证代币 (SP Token)，代表存款份额
        IDebtToken jpCoin; // 借款人凭证代币 (JP Token)，代表借款份额/债务
        uint256 autoLiquidateThreshold; // 自动清算阈值 (当抵押率跌破此值时触发清算)
    }
    // 所有池子的基本信息数组
    PoolBaseInfo[] public poolBaseInfo;

    // 每个池的数据统计信息结构体
    struct PoolDataInfo {
        uint256 settleAmountLend; // 结算时锁定的出借金额 (本金)
        uint256 settleAmountBorrow; // 结算时锁定的抵押物金额 (数量)
        uint256 finishAmountLend; // 完成时 (Finish) 最终结算给 Lender 的金额 (含利息)
        uint256 finishAmountBorrow; // 完成时 (Finish) 最终退还给 Borrower 的抵押物金额
        uint256 liquidationAmounLend; // 清算时 (Liquidation) 变卖后给 Lender 的金额
        uint256 liquidationAmounBorrow; // 清算时 (Liquidation) 剩余退还给 Borrower 的金额
    }
    // 所有池子的数据统计数组
    PoolDataInfo[] public poolDataInfo;

    // 借款人 (Borrower) 的个人信息
    struct BorrowInfo {
        uint256 stakeAmount; // 用户当前存入的抵押品数量
        uint256 refundAmount; // 多余的退款金额 (如果募集超额或失败)
        bool hasNoRefund; // 是否已退款标志，默认为false，true表示已退款
        bool hasNoClaim; // 是否已认领借款标志，默认为false，true表示已认领
    }
    // 借款人信息映射: {用户地址 : {池子ID : 借款人信息}}
    mapping(address => mapping(uint256 => BorrowInfo)) public userBorrowInfo;

    // 存款人 (Lender) 的个人信息
    struct LendInfo {
        uint256 stakeAmount; // 用户当前存入的资金数量
        uint256 refundAmount; // 超额退款金额
        bool hasNoRefund; // 是否已退款标志
        bool hasNoClaim; // 是否已领取 SP Token 标志
    }

    // 存款人信息映射: {用户地址 : {池子ID : 存款人信息}}
    mapping(address => mapping(uint256 => LendInfo)) public userLendInfo;

    // ================= 事件定义 =================

    // 存款借出事件：记录 Lender 存钱
    // from: 存款人, token: 存入代币, amount: 存入数量, mintAmount: 实际记账数量
    event DepositLend(
        address indexed from,
        address indexed token,
        uint256 amount,
        uint256 mintAmount
    );
    // 借出退款事件：募集过多或失败时退款
    event RefundLend(
        address indexed from,
        address indexed token,
        uint256 refund
    );
    // 借出索赔事件 (领取 SP Token)
    event ClaimLend(
        address indexed from,
        address indexed token,
        uint256 amount
    );
    // 提取借出事件 (到期提款)：Lender 取回本金+利息
    event WithdrawLend(
        address indexed from,
        address indexed token,
        uint256 amount,
        uint256 burnAmount
    );

    // 存款借入事件 (抵押)：Borrower 存入抵押品
    event DepositBorrow(
        address indexed from,
        address indexed token,
        uint256 amount,
        uint256 mintAmount
    );
    // 借入退款事件：退还多余抵押品
    event RefundBorrow(
        address indexed from,
        address indexed token,
        uint256 refund
    );
    // 借入索赔事件 (领取借款)：Borrower 拿到借出的钱
    event ClaimBorrow(
        address indexed from,
        address indexed token,
        uint256 amount
    );
    // 提取借入事件 (还款取回抵押品)：Borrower 还钱并取回抵押物
    event WithdrawBorrow(
        address indexed from,
        address indexed token,
        uint256 amount,
        uint256 burnAmount
    );

    // 交换事件 (Swap)：清算或结算时发生的代币兑换
    event Swap(
        address indexed fromCoin,
        address indexed toCoin,
        uint256 fromValue,
        uint256 toValue
    );
    // 紧急提取（借入方）
    event EmergencyBorrowWithdrawal(
        address indexed from,
        address indexed token,
        uint256 amount
    );
    // 紧急提取（借出方）
    event EmergencyLendWithdrawal(
        address indexed from,
        address indexed token,
        uint256 amount
    );

    // 状态改变事件：记录池子生命周期的流转 (MATCH -> EXECUTION -> FINISH/LIQUIDATION)
    event StateChange(
        uint256 indexed pid,
        uint256 indexed beforeState,
        uint256 indexed afterState
    );

    // 设置费用事件
    event SetFee(uint256 indexed newLendFee, uint256 indexed newBorrowFee);
    // 设置交换路由器地址事件
    event SetSwapRouterAddress(
        address indexed oldSwapAddress,
        address indexed newSwapAddress
    );
    // 设置费用接收地址事件
    event SetFeeAddress(
        address indexed oldFeeAddress,
        address indexed newFeeAddress
    );
    // 设置最小存款金额事件
    event SetMinAmount(
        uint256 indexed oldMinAmount,
        uint256 indexed newMinAmount
    );

    constructor(
        address _oracle,
        address _swapRouter,
        address payable _feeAddress,
        address _multiSignature
    ) public multiSignatureClient(_multiSignature) {
        require(_oracle != address(0), "Is zero address");
        require(_swapRouter != address(0), "Is zero address");
        require(_feeAddress != address(0), "Is zero address");

        oracle = IBscPledgeOracle(_oracle);
        swapRouter = _swapRouter;
        feeAddress = _feeAddress;
        lendFee = 0;
        borrowFee = 0;
    }

    /**
     * @dev 设置借贷费用率
     * @notice 仅管理员可操作
     * @param _lendFee 存款人费用率
     * @param _borrowFee 借款人费用率
     */
    function setFee(uint256 _lendFee, uint256 _borrowFee) external validCall {
        lendFee = _lendFee;
        borrowFee = _borrowFee;
        emit SetFee(_lendFee, _borrowFee);
    }

    /**
     * @dev 设置 Swap 路由地址 (例如 PancakeSwap)
     * @notice 仅管理员可操作
     */
    function setSwapRouterAddress(address _swapRouter) external validCall {
        require(_swapRouter != address(0), "Is zero address");
        emit SetSwapRouterAddress(swapRouter, _swapRouter);
        swapRouter = _swapRouter;
    }

    /**
     * @dev 设置接收手续费的地址
     * @notice 仅管理员可操作
     */
    function setFeeAddress(address payable _feeAddress) external validCall {
        require(_feeAddress != address(0), "Is zero address");
        emit SetFeeAddress(feeAddress, _feeAddress);
        feeAddress = _feeAddress;
    }

    /**
     * @dev 设置最小存款金额
     */
    function setMinAmount(uint256 _minAmount) external validCall {
        emit SetMinAmount(minAmount, _minAmount);
        minAmount = _minAmount;
    }

    /**
     * @dev 查询当前有多少个借贷池
     */
    function poolLength() external view returns (uint256) {
        return poolBaseInfo.length;
    }

    /**
     * @dev 创建一个新的借贷池。
     * @notice 核心初始化函数，定义了借贷产品的各项参数。
     * @param _settleTime 结算时间 (Unix时间戳)，到达此时间后停止募集，开始计息
     * @param _endTime 结束时间 (Unix时间戳)，到达此时间后借款到期
     * @param _interestRate 固定年化利率 (精度 1e8)
     * @param _maxSupply 最大存款限额 (Hard Cap)
     * @param _martgageRate 抵押率 (例如 2e8 表示 200% 抵押)
     * @param _lendToken 存款代币地址 (资金端)
     * @param _borrowToken 抵押代币地址 (资产端)
     * @param _spToken SP Token 地址 (存款凭证，需预先部署)
     * @param _jpToken JP Token 地址 (借款/债务凭证，需预先部署)
     * @param _autoLiquidateThreshold 自动清算阈值 (当 current_value < lend_amount * (1+threshold) 时触发清算)
     */
    function createPoolInfo(
        uint256 _settleTime,
        uint256 _endTime,
        uint64 _interestRate,
        uint256 _maxSupply,
        uint256 _martgageRate,
        address _lendToken,
        address _borrowToken,
        address _spToken,
        address _jpToken,
        uint256 _autoLiquidateThreshold
    ) public validCall {
        // 检查参数合法性
        // 结束时间必须晚于结算时间
        require(
            _endTime > _settleTime,
            "createPool:end time grate than settle time"
        );
        // Token 地址不能为零
        require(_jpToken != address(0), "createPool:is zero address");
        require(_spToken != address(0), "createPool:is zero address");

        // 将新池子的基本信息推入数组
        poolBaseInfo.push(
            PoolBaseInfo({
                settleTime: _settleTime,
                endTime: _endTime,
                interestRate: _interestRate,
                maxSupply: _maxSupply,
                lendSupply: 0, // 初始存款为0
                borrowSupply: 0, // 初始抵押为0
                martgageRate: _martgageRate,
                lendToken: _lendToken,
                borrowToken: _borrowToken,
                state: defaultChoice, // 初始状态为 MATCH
                spCoin: IDebtToken(_spToken),
                jpCoin: IDebtToken(_jpToken),
                autoLiquidateThreshold: _autoLiquidateThreshold
            })
        );
        // 初始化池子的数据统计信息
        poolDataInfo.push(
            PoolDataInfo({
                settleAmountLend: 0,
                settleAmountBorrow: 0,
                finishAmountLend: 0,
                finishAmountBorrow: 0,
                liquidationAmounLend: 0,
                liquidationAmounBorrow: 0
            })
        );
    }

      /**
     * @dev 获取池子的当前状态
     * @param _pid 池子索引 ID
     * @return 状态枚举值 (0=MATCH, 1=EXECUTION, ...)
     */
    function getPoolState(uint256 _pid) public view returns (uint256) {
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        return uint256(pool.state);
    }

       /**
     * @dev 存款人 (Lender) 存款操作
     * @notice 池状态必须为 MATCH，且时间必须在结算时间之前。
     * @param _pid 池索引
     * @param _stakeAmount 存款金额 (注意：如果是 ETH/BNB，这个参数会被忽略，使用 msg.value)
     */
    function depositLend(uint256 _pid, uint256 _stakeAmount) external payable nonReentrant notPause timeBefore(_pid) stateMatch(_pid){
        // 获取池信息
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        LendInfo storage lendInfo = userLendInfo[msg.sender][_pid];
        
        // 边界条件检查: 确保未超过池子的最大募集限额
        require(_stakeAmount <= (pool.maxSupply).sub(pool.lendSupply), "depositLend: 数量超过限制");
        
        // 计算实际到账金额 (对于非ETH代币，主要是防止转账失败或手续费扣除)
        // getPayableAmount 是 internal 函数，用于处理 ETH 和 ERC20 的不同转账逻辑
        uint256 amount = getPayableAmount(pool.lendToken,_stakeAmount);
        require(amount > minAmount, "depositLend: 少于最小金额");
        
        // 重置用户状态标志 (允许后续退款或领取)
        lendInfo.hasNoClaim = false;
        lendInfo.hasNoRefund = false;
        
        // 更新池子和用户的数据
        if (pool.lendToken == address(0)){
            // 如果是原生代币 (ETH/BNB)，使用 msg.value
            lendInfo.stakeAmount = lendInfo.stakeAmount.add(msg.value);
            pool.lendSupply = pool.lendSupply.add(msg.value);
        } else {
            // 如果是 ERC20，使用传入的 _stakeAmount
            lendInfo.stakeAmount = lendInfo.stakeAmount.add(_stakeAmount);
            pool.lendSupply = pool.lendSupply.add(_stakeAmount);
        }
        
        // 触发存款事件
        emit DepositLend(msg.sender, pool.lendToken, _stakeAmount, amount);
    }

       /**
     * @dev 退还过量存款给存款人 (Refund Lend)
     * @notice 场景：当募集期结束或未成功募集满额，或者发生退款条件时，用户可以取回多余的资金。
     * 只有当池子状态 *不是* MATCH 且 *不是* UNDONE 时，才意味着可能进入了结算阶段但有多余资金需退回。
     * @param _pid 池索引
     */
    function refundLend(uint256 _pid) external nonReentrant notPause timeAfter(_pid) stateNotMatchUndone(_pid){
        PoolBaseInfo storage pool = poolBaseInfo[_pid]; // 获取池的基本信息
        PoolDataInfo storage data = poolDataInfo[_pid]; // 获取池的数据信息
        LendInfo storage lendInfo = userLendInfo[msg.sender][_pid]; // 获取用户的出借信息
        
        // 验证用户是否有存款且未退款
        require(lendInfo.stakeAmount > 0, "refundLend: not pledged"); 
        // 验证池子是否有需要退还的资金 (总募集量 > 实际结算量)
        require(pool.lendSupply.sub(data.settleAmountLend) > 0, "refundLend: not refund"); 
        require(!lendInfo.hasNoRefund, "refundLend: repeat refund"); 
        
        // 计算用户在该池子中的份额占比
        // 用户份额 = (用户质押金额 / 总质押金额) * 精度
        uint256 userShare = lendInfo.stakeAmount.mul(calDecimal).div(pool.lendSupply);
        
        // 计算应退还金额 = (总募集 - 实际结算) * 用户份额
        uint256 refundAmount = (pool.lendSupply.sub(data.settleAmountLend)).mul(userShare).div(calDecimal);
        
        // 执行退款转账
        _redeem(msg.sender,pool.lendToken,refundAmount);
        
        // 更新用户状态，标记已退款，并累加记录退款金额
        lendInfo.hasNoRefund = true;
        lendInfo.refundAmount = lendInfo.refundAmount.add(refundAmount);
        emit RefundLend(msg.sender, pool.lendToken, refundAmount); 
    }

     /**
     * @dev 存款人领取 SP Token (Claim Lend)
     * @notice SP Token (Share Token of Pool) 是存款凭证。
     * 当池子进入 EXECUTION 阶段后，存款人凭借自己的份额领取 SP Token。
     * 将来还款或清算时，需要销毁 SP Token 来取回本金和利息。
     * @param _pid 池索引
     */
    function claimLend(uint256 _pid) external nonReentrant notPause timeAfter(_pid) stateNotMatchUndone(_pid){
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        PoolDataInfo storage data = poolDataInfo[_pid];
        LendInfo storage lendInfo = userLendInfo[msg.sender][_pid];
        
        // 检查资格：已质押且未领取
        require(lendInfo.stakeAmount > 0, "claimLend: 不能领取 sp_token"); 
        require(!lendInfo.hasNoClaim,"claimLend: 不能再次领取"); 
        
        // 计算份额
        uint256 userShare = lendInfo.stakeAmount.mul(calDecimal).div(pool.lendSupply); 
        
        // 计算应得的 SP Token 数量
        // SP Token 总量 = 实际结算的出借金额 (settleAmountLend)
        uint256 totalSpAmount = data.settleAmountLend; 
        uint256 spAmount = totalSpAmount.mul(userShare).div(calDecimal); 
        
        // 铸造 SP Token 给用户
        pool.spCoin.mint(msg.sender, spAmount); 
        
        // 更新领取标志
        lendInfo.hasNoClaim = true; 
        emit ClaimLend(msg.sender, pool.borrowToken, spAmount); 
    }

    /**
     * @dev 存款人提现 (Withdraw Lend)
     * @notice 只有在 FINISH (正常到期) 或 LIQUIDATION (发生清算) 状态下才能提现。
     * 用户需要传入要销毁的 SP Token 数量来换回资金。
     * @param _pid 池索引
     * @param _spAmount 销毁的 SP Token 数量
     */
    function withdrawLend(uint256 _pid, uint256 _spAmount)  external nonReentrant notPause stateFinishLiquidation(_pid) {
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        PoolDataInfo storage data = poolDataInfo[_pid];
        require(_spAmount > 0, 'withdrawLend: 取款金额为零');
        
        // 销毁用户的 SP Token，这是提现的前提
        pool.spCoin.burn(msg.sender,_spAmount);
        
        // 计算销毁的份额比例
        uint256 totalSpAmount = data.settleAmountLend;
        uint256 spShare = _spAmount.mul(calDecimal).div(totalSpAmount);
        
        // 场景 1: FINISH (正常还款结束)
        if (pool.state == PoolState.FINISH){
            require(block.timestamp > pool.endTime, "withdrawLend: 少于结束时间");
            // 计算能赎回的金额 (含利息)
            // redeemAmount = 最终结算池金额 * 份额
            uint256 redeemAmount = data.finishAmountLend.mul(spShare).div(calDecimal);
            // 转账给用户
             _redeem(msg.sender,pool.lendToken,redeemAmount);
            emit WithdrawLend(msg.sender,pool.lendToken,redeemAmount,_spAmount);
        }
        
        // 场景 2: LIQUIDATION (发生清算)
        if (pool.state == PoolState.LIQUIDATION) {
            // 清算只需在结算时间之后即可触发 (通常意味着中途违约)
            require(block.timestamp > pool.settleTime, "withdrawLend: 少于匹配时间");
            // 计算清算后剩余的残值 (通常少于本金，或者是变卖抵押品后的所得)
            uint256 redeemAmount = data.liquidationAmounLend.mul(spShare).div(calDecimal);
            // 转账给用户
             _redeem(msg.sender,pool.lendToken,redeemAmount);
            emit WithdrawLend(msg.sender,pool.lendToken,redeemAmount,_spAmount);
        }
    }

       /**
     * @dev 紧急提取贷款 (Emergency Lend Withdrawal)
     * @notice 仅当池子状态为 UNDONE (未完成/撤销) 时允许调用。
     * 这通常发生在募集期结束但未能成功启动（例如未达到最小金额或极端异常）。
     * 用户可以取回所有本金。
     * @param _pid 池索引
     */
    function emergencyLendWithdrawal(uint256 _pid) external nonReentrant notPause stateUndone(_pid){
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        require(pool.lendSupply > 0,"emergencLend: not withdrawal"); 
        
        LendInfo storage lendInfo = userLendInfo[msg.sender][_pid];
        require(lendInfo.stakeAmount > 0, "refundLend: not pledged"); 
        require(!lendInfo.hasNoRefund, "refundLend: again refund"); 
        
        // 全额退还本金
        _redeem(msg.sender,pool.lendToken,lendInfo.stakeAmount); 
        
        lendInfo.hasNoRefund = true; 
        emit EmergencyLendWithdrawal(msg.sender, pool.lendToken, lendInfo.stakeAmount); 
    }



       /**
     * @dev 借款人质押操作 (Deposit Borrow)
     * @notice 借款人存入抵押品 (Collateral)。
     * 池状态必须为 MATCH，时间在结算前。
     * @param _pid 池索引
     * @param _stakeAmount 质押金额 (ETH则忽略此参数)
     */
    function depositBorrow(uint256 _pid, uint256 _stakeAmount ) external payable nonReentrant notPause timeBefore(_pid) stateMatch(_pid){
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        BorrowInfo storage borrowInfo = userBorrowInfo[msg.sender][_pid];
        
        // 处理转账逻辑 (ETH vs ERC20)
        uint256 amount = getPayableAmount(pool.borrowToken, _stakeAmount); 
        require(amount > 0, 'depositBorrow: deposit amount is zero');
        
        // 重置用户状态
        borrowInfo.hasNoClaim = false; 
        borrowInfo.hasNoRefund = false; 
        
        // 更新数据
        if (pool.borrowToken == address(0)){ 
            borrowInfo.stakeAmount = borrowInfo.stakeAmount.add(msg.value); 
            pool.borrowSupply = pool.borrowSupply.add(msg.value); 
        } else{ 
            borrowInfo.stakeAmount = borrowInfo.stakeAmount.add(_stakeAmount); 
            pool.borrowSupply = pool.borrowSupply.add(_stakeAmount); 
        }
        emit DepositBorrow(msg.sender, pool.borrowToken, _stakeAmount, amount); 
    }

        /**
     * @dev 退还给借款人的过量抵押品 (Refund Borrow)
     * @notice 场景：当募集期结束，如果质押的资产超过了实际借款所需（或者借款端未满额），
     * 借款人可以取回这部分多余的抵押品。
     * @param _pid 池状态
     */
    function refundBorrow(uint256 _pid) external nonReentrant notPause timeAfter(_pid) stateNotMatchUndone(_pid){
        PoolBaseInfo storage pool = poolBaseInfo[_pid]; 
        PoolDataInfo storage data = poolDataInfo[_pid]; 
        BorrowInfo storage borrowInfo = userBorrowInfo[msg.sender][_pid]; 
        
        // 条件检查：必须有剩余抵押品需退还
        require(pool.borrowSupply.sub(data.settleAmountBorrow) > 0, "refundBorrow: not refund"); 
        require(borrowInfo.stakeAmount > 0, "refundBorrow: not pledged"); 
        require(!borrowInfo.hasNoRefund, "refundBorrow: again refund"); 
        
        // 份额计算
        uint256 userShare = borrowInfo.stakeAmount.mul(calDecimal).div(pool.borrowSupply); 
        uint256 refundAmount = (pool.borrowSupply.sub(data.settleAmountBorrow)).mul(userShare).div(calDecimal); 
        
        // 执行退款
        _redeem(msg.sender,pool.borrowToken,refundAmount); 
        
        borrowInfo.refundAmount = borrowInfo.refundAmount.add(refundAmount); 
        borrowInfo.hasNoRefund = true;
        emit RefundBorrow(msg.sender, pool.borrowToken, refundAmount); 
    }

       /**
     * @dev 借款人领取 JP Token 和 贷款资金 (Claim Borrow)
     * @notice 借款人成功借到钱的函数。
     * 同时会铸造 JP Token (债务凭证) 给借款人。
     * @param _pid 池索引
     */
    function claimBorrow(uint256 _pid) external nonReentrant notPause timeAfter(_pid) stateNotMatchUndone(_pid)  {
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        PoolDataInfo storage data = poolDataInfo[_pid];
        BorrowInfo storage borrowInfo = userBorrowInfo[msg.sender][_pid];
        
        require(borrowInfo.stakeAmount > 0, "claimBorrow: 没有索取 jp_token");
        require(!borrowInfo.hasNoClaim,"claimBorrow: 再次索取");
        
        // 计算用户份额
        // JP Token 总量 = 实际借出金额 * 抵押率
        // 注意：这里 JP Token 的逻辑似乎是将其与债务价值挂钩
        uint256 totalJpAmount = data.settleAmountLend.mul(pool.martgageRate).div(baseDecimal);
        uint256 userShare = borrowInfo.stakeAmount.mul(calDecimal).div(pool.borrowSupply);
        uint256 jpAmount = totalJpAmount.mul(userShare).div(calDecimal);
        
        // 铸造 JP Token (给借款人，作为负债证明)
        pool.jpCoin.mint(msg.sender, jpAmount);
        
        // 计算用户实际借到的资金 (Lend Token)
        uint256 borrowAmount = data.settleAmountLend.mul(userShare).div(calDecimal);
        _redeem(msg.sender,pool.lendToken,borrowAmount);
        
        borrowInfo.hasNoClaim = true;
        emit ClaimBorrow(msg.sender, pool.borrowToken, jpAmount);
    }

       /**
     * @dev 借款人赎回抵押品 (Withdraw Borrow)
     * @notice 还款操作的逆向过程，或者清算后的残值提取。
     * 用户需销毁 JP Token 来取回抵押品。
     * @param _pid 池索引
     * @param _jpAmount 销毁的 JP Token 数量
     */
    function withdrawBorrow(uint256 _pid, uint256 _jpAmount ) external nonReentrant notPause stateFinishLiquidation(_pid) {
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        PoolDataInfo storage data = poolDataInfo[_pid];
        
        require(_jpAmount > 0, 'withdrawBorrow: withdraw amount is zero');
        
        // 销毁 JP Token
        pool.jpCoin.burn(msg.sender,_jpAmount);
        
        // 计算份额
        uint256 totalJpAmount = data.settleAmountLend.mul(pool.martgageRate).div(baseDecimal);
        uint256 jpShare = _jpAmount.mul(calDecimal).div(totalJpAmount);
        
        // 场景 1: FINISH (正常结束)
        if (pool.state == PoolState.FINISH) {
            require(block.timestamp > pool.endTime, "withdrawBorrow: less than end time");
            // 一般此时意味着借款人已还款（或只是取回剩余部分，具体逻辑看 finish）
            // 在此合约逻辑中，FINISH 时 finishAmountBorrow 是扣除还款后的剩余抵押品
            uint256 redeemAmount = jpShare.mul(data.finishAmountBorrow).div(calDecimal);
            _redeem(msg.sender,pool.borrowToken,redeemAmount);
            emit WithdrawBorrow(msg.sender, pool.borrowToken, _jpAmount, redeemAmount);
        }
        
        // 场景 2: LIQUIDATION (清算)
        if (pool.state == PoolState.LIQUIDATION){
            require(block.timestamp > pool.settleTime, "withdrawBorrow: less than match time");
            // 取回清算后剩余的抵押品
            uint256 redeemAmount = jpShare.mul(data.liquidationAmounBorrow).div(calDecimal);
            _redeem(msg.sender,pool.borrowToken,redeemAmount);
            emit WithdrawBorrow(msg.sender, pool.borrowToken, _jpAmount, redeemAmount);
        }
    }
       /**
     * @dev 紧急借款提取 (Emergency Borrow Withdrawal)
     * @notice 在 UNDONE 状态下，借款人取回所有质押品。
     * @param _pid 池子的索引
     */
    function emergencyBorrowWithdrawal(uint256 _pid) external nonReentrant notPause stateUndone(_pid) {
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        require(pool.borrowSupply > 0,"emergencyBorrow: not withdrawal");
        BorrowInfo storage borrowInfo = userBorrowInfo[msg.sender][_pid];
        
        require(borrowInfo.stakeAmount > 0, "refundBorrow: not pledged");
        require(!borrowInfo.hasNoRefund, "refundBorrow: again refund");
        
        // 执行全额赎回
        _redeem(msg.sender,pool.borrowToken,borrowInfo.stakeAmount);
        
        borrowInfo.hasNoRefund = true;
        emit EmergencyBorrowWithdrawal(msg.sender, pool.borrowToken, borrowInfo.stakeAmount);
    }

    /**
     * @dev 检查是否满足结算条件
     * @param _pid 池索引
     */
    function checkoutSettle(uint256 _pid) public view returns(bool){
        return block.timestamp > poolBaseInfo[_pid].settleTime;
    }

       /**
     * @dev 结算 (Settle)
     * @notice 将池子状态从 MATCH 转变为 EXECUTION。
     * 只有在到达 settleTime 后才能调用。
     * 此阶段会计算实际有效的借贷金额，多余的资金会在后续 refund 步骤中退还给用户。
     * @param _pid 池子索引
     */
    function settle(uint256 _pid) public validCall {
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        PoolDataInfo storage data = poolDataInfo[_pid];
        
        require(block.timestamp > poolBaseInfo[_pid].settleTime, "settle: 小于结算时间");
        require(pool.state == PoolState.MATCH, "settle: 池子状态必须是匹配");
        
        // 场景：两边都有人参与，可以匹配
        if (pool.lendSupply > 0 && pool.borrowSupply > 0) {
            // 获取当前抵押品和借出代币的价格
            uint256[2]memory prices = getUnderlyingPriceView(_pid);
            
            // 计算借款端总抵押价值 (Total Collateral Value)
            // borrowSupply * (price_borrow / price_lend)
            // 公式解释：价格比 = price_borrow / price_lend, 乘上 borrowSupply 即为以 lendToken 计价的抵押总值
            uint256 totalValue = pool.borrowSupply.mul(prices[1].mul(calDecimal).div(prices[0])).div(calDecimal);
            
            // 计算由于抵押率限制，最大可借出金额 (Max Borrowable Value)
            // actualValue = 抵押总值 / 抵押率
            // 例如：抵押总值100万，抵押率200%，则最大可借出50万
            uint256 actualValue = totalValue.mul(baseDecimal).div(pool.martgageRate);
            
            if (pool.lendSupply > actualValue){
                // 情况 A: 存款过多 (Lend Supply > Max Borrowable)
                // 只能借出 actualValue，多余的存款需要退款
                data.settleAmountLend = actualValue;
                data.settleAmountBorrow = pool.borrowSupply; // 抵押品全额接受
            } else {
                // 情况 B: 抵押过多 (Lend Supply < Max Borrowable)
                // 所有的存款都能借出
                data.settleAmountLend = pool.lendSupply;
                // 计算只需锁定多少抵押品 (剩余的抵押品可退款)
                // 锁定抵押品 = 借款金额 * 抵押率 / 价格比
                data.settleAmountBorrow = pool.lendSupply.mul(pool.martgageRate).div(prices[1].mul(baseDecimal).div(prices[0]));
            }
            
            // 状态流转 -> EXECUTION
            pool.state = PoolState.EXECUTION;
            emit StateChange(_pid,uint256(PoolState.MATCH), uint256(PoolState.EXECUTION));
        } else {
            // 极端情况：有一方未参与 (Fail to Match)
            // 状态流转 -> UNDONE，所有资金可退回
            pool.state = PoolState.UNDONE;
            data.settleAmountLend = pool.lendSupply;
            data.settleAmountBorrow = pool.borrowSupply;
            emit StateChange(_pid,uint256(PoolState.MATCH), uint256(PoolState.UNDONE));
        }
    }

    /**
     * @dev 检查是否满足结束条件
     * @param _pid 池索引
     */
    function checkoutFinish(uint256 _pid) public view returns(bool){
        return block.timestamp > poolBaseInfo[_pid].endTime;
    }

    /**
     * @dev 正常结束 (Finish)
     * @notice 在到期时间 (endTime) 后调用。
     * 此过程涉及将借款人已还款的资金（或从池中清算的资金）进行最终结算分配。
     * 但注意：此函数实际上包含了一个自动变卖抵押品还款的逻辑（如果这是一个自动还款池？或者此处逻辑其实更像是一个强制结算逻辑）。
     * 仔细看代码：它使用 swapRouter 将 sellAmount (本金+利息) 卖掉？
     * **解析**: 这里的逻辑看起来是借款人不需要手动还款，而是合约自动卖掉抵押品来还款？
     * 不，这看起来像是如果借款人不还款，系统强制执行结束流程。或者这就是该协议的设计：到期自动交割。
     * 看代码第598行： `_sellExactAmount`，它在卖出 token0 (borrowToken, 抵押品) 换取 token1 (lendToken, 资金)。
     * 结论：Pledge V2 似乎设计为到期自动交割模式，或者是必须在 finish 前还款，否则 finish 会强制变卖抵押品来还贷。
     * @param _pid 是池子的索引
     */
    function finish(uint256 _pid) public validCall {
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        PoolDataInfo storage data = poolDataInfo[_pid];

        require(block.timestamp > poolBaseInfo[_pid].endTime, "finish: less than end time");
        require(pool.state == PoolState.EXECUTION,"finish: pool state must be execution");

        (address token0, address token1) = (pool.borrowToken, pool.lendToken);

        // 计算存续时长比率 (Time Ratio)
        // 实际利息只计算 settleTime 到 endTime 这段时间
        uint256 timeRatio = ((pool.endTime.sub(pool.settleTime)).mul(baseDecimal)).div(baseYear);

        // 计算应付利息 = 本金 * 利率 * 时间比率
        uint256 interest = timeRatio.mul(pool.interestRate.mul(data.settleAmountLend)).div(1e16);

        // 计算Lender应得总额 = 本金 + 利息
        uint256 lendAmount = data.settleAmountLend.add(interest);

        // 计算需要通过 Swap 获得的金额 (含手续费)
        // sellAmount (Target) = lendAmount * (1 + lendFee)
        // 这里变量名 sellAmount 有点误导，实际上是 "Target Receive Amount of Lend Token"
        uint256 sellAmount = lendAmount.mul(lendFee.add(baseDecimal)).div(baseDecimal);

        // 执行 Swap: 卖出抵押品 (token0) -> 买入借出代币 (token1)
        // 这是一个兜底操作，确保 Lender 能拿回钱。
        // FIXME: 如果 Swap 滑点过大或者流动性不足，这里会失败。
        (uint256 amountSell,uint256 amountIn) = _sellExactAmount(swapRouter,token0,token1,sellAmount);

        // 确保换回来的钱够还
        require(amountIn >= lendAmount, "finish: Slippage is too high");

        if (amountIn > lendAmount) {
            uint256 feeAmount = amountIn.sub(lendAmount);
            // 将多余的金额作为费用转给 feeAddress
            _redeem(feeAddress,pool.lendToken, feeAmount);
            data.finishAmountLend = amountIn.sub(feeAmount);
        }else {
            data.finishAmountLend = amountIn; // 理论上不会走到这，因为上面有 require
        }

        // 计算剩余抵押品
        // 剩余抵押品 = 总抵押品 - 已卖出的抵押品
        uint256 remianNowAmount = data.settleAmountBorrow.sub(amountSell);
        // 扣除借款费用后，更新 finishAmountBorrow (这是借款人能拿回的剩余抵押品)
        uint256 remianBorrowAmount = redeemFees(borrowFee,pool.borrowToken,remianNowAmount);
        data.finishAmountBorrow = remianBorrowAmount;

        // 状态流转 -> FINISH
        pool.state = PoolState.FINISH;
        emit StateChange(_pid,uint256(PoolState.EXECUTION), uint256(PoolState.FINISH));
    }


    /**
     * @dev 检查是否需要清算
     * @notice 判断当前抵押品价值是否跌破了预警线。
     * @param _pid 是池子的索引
     * @return true = 需要清算
     */
    function checkoutLiquidate(uint256 _pid) external view returns(bool) {
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        PoolDataInfo storage data = poolDataInfo[_pid];
        
        uint256[2]memory prices = getUnderlyingPriceView(_pid);
        
        // 计算抵押品当前市值
        uint256 borrowValueNow = data.settleAmountBorrow.mul(prices[1].mul(calDecimal).div(prices[0])).div(calDecimal);
        
        // 计算清算阈值价值 (Liquidation Threshold Value)
        // 阈值 = 借出本金 * (1 + 自动清算阈值率)
        // 例如：本金100，阈值率 10%，则当抵押品价值跌破 110 时触发清算
        uint256 valueThreshold = data.settleAmountLend.mul(baseDecimal.add(pool.autoLiquidateThreshold)).div(baseDecimal);
        
        return borrowValueNow < valueThreshold; 
    }

        /**
     * @dev 执行清算 (Liquidate)
     * @notice 当抵押率不足时强制变卖抵押品还债。
     * 逻辑与 finish 类似，但触发条件和时间点不同。
     * @param _pid 是池子的索引
     */
    function liquidate(uint256 _pid) public validCall {
        PoolDataInfo storage data = poolDataInfo[_pid];
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        
        require(block.timestamp > pool.settleTime, "现在的时间小于匹配时间");
        require(pool.state == PoolState.EXECUTION,"liquidate: 池子的状态必须是执行状态");
        
        (address token0, address token1) = (pool.borrowToken, pool.lendToken);
        
        // 计算到当前时刻应付的利息
        // 注意：清算时是按照整个周期的时间比例还是当前时间？
        // 代码里用的是 `pool.endTime.sub(pool.settleTime)` 即按照【全周期】利息计算？
        // 这意味着借款人即使提前清算，也要付全额利息？这对 Lender 是保护。
        uint256 timeRatio = ((pool.endTime.sub(pool.settleTime)).mul(baseDecimal)).div(baseYear);
        uint256 interest = timeRatio.mul(pool.interestRate.mul(data.settleAmountLend)).div(1e16);
        
        uint256 lendAmount = data.settleAmountLend.add(interest);
        
        // 计算需要卖出的目标金额
        uint256 sellAmount = lendAmount.mul(lendFee.add(baseDecimal)).div(baseDecimal);
        
        // 执行 Swap
        (uint256 amountSell,uint256 amountIn) = _sellExactAmount(swapRouter,token0,token1,sellAmount);
        
        // 分配资金和手续费
        if (amountIn > lendAmount) {
            uint256 feeAmount = amountIn.sub(lendAmount) ; 
            _redeem(feeAddress,pool.lendToken, feeAmount);
            data.liquidationAmounLend = amountIn.sub(feeAmount);
        }else {
            data.liquidationAmounLend = amountIn;
        }
        
        // 计算并更新剩余抵押品
        uint256 remianNowAmount = data.settleAmountBorrow.sub(amountSell); 
        uint256 remianBorrowAmount = redeemFees(borrowFee,pool.borrowToken,remianNowAmount); 
        data.liquidationAmounBorrow = remianBorrowAmount;
        
        // 状态流转 -> LIQUIDATION
        pool.state = PoolState.LIQUIDATION;
        emit StateChange(_pid,uint256(PoolState.EXECUTION), uint256(PoolState.LIQUIDATION));
    }


    /**
     * @dev 内部函数：计算并扣除费用
     * @param feeRatio 费率
     * @param token 代币地址
     * @param amount 总金额
     * @return 扣除费用后的剩余金额
     */
    function redeemFees(uint256 feeRatio,address token,uint256 amount) internal returns (uint256){
        uint256 fee = amount.mul(feeRatio)/baseDecimal;
        if (fee>0){
            _redeem(feeAddress,token, fee);
        }
        return amount.sub(fee);
    }



    /**
     * @dev 获取代币交换路径 (Path)
     * @notice 如果涉及 ETH (address(0))，会自动替换为 WETH。
     */
    function _getSwapPath(address _swapRouter,address token0,address token1) internal pure returns (address[] memory path){
        IUniswapV2Router02 IUniswap = IUniswapV2Router02(_swapRouter);
        path = new address[](2);
        path[0] = token0 == address(0) ? IUniswap.WETH() : token0;
        path[1] = token1 == address(0) ? IUniswap.WETH() : token1;
    }

     /**
      * @dev 根据预期的输出 amountOut，计算需要的输入 amountIn
      */
    function _getAmountIn(address _swapRouter,address token0,address token1,uint256 amountOut) internal view returns (uint256){
        IUniswapV2Router02 IUniswap = IUniswapV2Router02(_swapRouter);
        address[] memory path = _getSwapPath(swapRouter,token0,token1);
        uint[] memory amounts = IUniswap.getAmountsIn(amountOut, path);
        return amounts[0];
    }

     /**
      * @dev 执行精确数量的卖出 (Sell Exact Amount)
      * @notice 尝试通过 Swap Router 获取精确的 amountOut (资金端代币)。
      * 返回 (实际卖出的抵押品数量, 实际获得的资金数量)。
      */
    function _sellExactAmount(address _swapRouter,address token0,address token1,uint256 amountout) internal returns (uint256,uint256){
        uint256 amountSell = amountout > 0 ? _getAmountIn(swapRouter,token0,token1,amountout) : 0;
        return (amountSell,_swap(_swapRouter,token0,token1,amountSell));
    }

    /**
      * @dev 底层 Swap 函数
      * @notice 调用 Uniswap Router 执行交易
      */
    function _swap(address _swapRouter,address token0,address token1,uint256 amount0) internal returns (uint256) {
        // 先授权 (Approve)
        if (token0 != address(0)){
            _safeApprove(token0, address(_swapRouter), uint256(-1));
        }
        if (token1 != address(0)){
            _safeApprove(token1, address(_swapRouter), uint256(-1));
        }
        
        IUniswapV2Router02 IUniswap = IUniswapV2Router02(_swapRouter);
        address[] memory path = _getSwapPath(_swapRouter,token0,token1);
        uint256[] memory amounts;
        
        // 根据代币类型选择不同的 Swap 方法
        if(token0 == address(0)){
            // ETH -> Token
            amounts = IUniswap.swapExactETHForTokens{value:amount0}(0, path,address(this), now+30);
        }else if(token1 == address(0)){
            // Token -> ETH
            amounts = IUniswap.swapExactTokensForETH(amount0,0, path, address(this), now+30);
        }else{
            // Token -> Token
            amounts = IUniswap.swapExactTokensForTokens(amount0,0, path, address(this), now+30);
        }
        emit Swap(token0,token1,amounts[0],amounts[amounts.length-1]);
        return amounts[amounts.length-1];
    }

    /**
     * @dev 安全授权 (Safe Approve)
     * @notice 兼容某些非标准 ERC20 的 approve 实现
     */
    function _safeApprove(address token, address to, uint256 value) internal {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x095ea7b3, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "!safeApprove");
    }

    /**
     * @dev 获取最新的预言机价格视图
     * @return [price_lendToken, price_borrowToken]
     */
    function getUnderlyingPriceView(uint256 _pid) public view returns(uint256[2]memory){
        PoolBaseInfo storage pool = poolBaseInfo[_pid];
        uint256[] memory assets = new uint256[](2);
        assets[0] = uint256(pool.lendToken);
        assets[1] = uint256(pool.borrowToken);
        
        // 从 Oracle 批量获取
        uint256[]memory prices = oracle.getPrices(assets);
        return [prices[0],prices[1]];
    }

    /**
     * @dev 全局暂停/恢复
     */
    function setPause() public validCall {
        globalPaused = !globalPaused;
    }

    // ================= 修饰符 (Modifiers) =================

    modifier notPause() {
        require(globalPaused == false, "Stake has been suspended");
        _;
    }


    modifier timeBefore(uint256 _pid) {
        require(block.timestamp < poolBaseInfo[_pid].settleTime, "Less than this time");
        _;
    }

    modifier timeAfter(uint256 _pid) {
        require(block.timestamp > poolBaseInfo[_pid].settleTime, "Greate than this time");
        _;
    }


    modifier stateMatch(uint256 _pid) {
        require(poolBaseInfo[_pid].state == PoolState.MATCH, "state: Pool status is not equal to match");
        _;
    }

    modifier stateNotMatchUndone(uint256 _pid) {
        require(poolBaseInfo[_pid].state == PoolState.EXECUTION || poolBaseInfo[_pid].state == PoolState.FINISH || poolBaseInfo[_pid].state == PoolState.LIQUIDATION,"state: not match and undone");
        _;
    }

    modifier stateFinishLiquidation(uint256 _pid) {
        require(poolBaseInfo[_pid].state == PoolState.FINISH || poolBaseInfo[_pid].state == PoolState.LIQUIDATION,"state: finish liquidation");
        _;
    }

    modifier stateUndone(uint256 _pid) {
        require(poolBaseInfo[_pid].state == PoolState.UNDONE,"state: state must be undone");
        _;
    }

}
