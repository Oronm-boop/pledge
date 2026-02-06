/*
 * ==================================================================================
 * poolService.go - 借贷池数据同步服务
 * ==================================================================================
 *
 * 【核心功能】
 * 该服务负责从区块链（BSC）上的 PledgePool 智能合约读取所有借贷池的状态信息，
 * 并将这些数据同步到 MySQL 数据库和 Redis 缓存中，供 API 服务对外提供查询。
 *
 * 【调用频率】
 * 由 gocron 定时任务调度器每 2 分钟调用一次 UpdateAllPoolInfo()
 *
 * 【与智能合约的关系】
 * - 调用 PledgePool.sol 的 poolLength() 获取池子总数
 * - 调用 PledgePool.sol 的 poolBaseInfo(uint256) 获取池子基础配置
 * - 调用 PledgePool.sol 的 poolDataInfo(uint256) 获取池子动态数据（结算/清算金额等）
 * - 调用 PledgePool.sol 的 borrowFee() 和 lendFee() 获取手续费率
 *
 * 【数据流向】
 * Blockchain (PledgePool.sol) --> poolService --> MySQL (poolbases/pooldata表) + Redis
 * ==================================================================================
 */

package services

import (
	"encoding/json"
	"math/big"
	"pledge-backend/config"
	"pledge-backend/contract/bindings"
	"pledge-backend/db"
	"pledge-backend/log"
	"pledge-backend/schedule/models"
	"pledge-backend/utils"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// poolService - 借贷池同步服务结构体
// 采用无状态设计，所有配置从 config 包读取
type poolService struct{}

// NewPool - 工厂函数，创建 poolService 实例
func NewPool() *poolService {
	return &poolService{}
}

// UpdateAllPoolInfo - 更新所有网络上的池子信息
// 【入口函数】由定时任务调度器调用
// 当前仅同步测试网 (TestNet)，主网代码已注释
func (s *poolService) UpdateAllPoolInfo() {
	// 同步测试网 (BSC Testnet, chainId: 97) 的池子数据
	s.UpdatePoolInfo(config.Config.TestNet.PledgePoolToken, config.Config.TestNet.NetUrl, config.Config.TestNet.ChainId)

	// 主网同步已禁用 (BSC Mainnet, chainId: 56)
	// s.UpdatePoolInfo(config.Config.MainNet.PledgePoolToken, config.Config.MainNet.NetUrl, config.Config.MainNet.ChainId)
}

// UpdatePoolInfo - 同步指定网络上的所有借贷池信息
// 【核心同步函数】
//
// 参数:
//   - contractAddress: PledgePool 智能合约地址
//   - network: RPC 节点 URL (如 https://bsc-testnet.public.blastapi.io)
//   - chainId: 链 ID (97=测试网, 56=主网)
//
// 执行流程:
//  1. 连接区块链 RPC 节点
//  2. 实例化 PledgePool 合约绑定
//  3. 读取全局费率 (borrowFee, lendFee)
//  4. 遍历所有池子，读取并同步 poolBaseInfo 和 poolDataInfo
func (s *poolService) UpdatePoolInfo(contractAddress, network, chainId string) {

	log.Logger.Sugar().Info("UpdatePoolInfo ", contractAddress+" "+network)

	// ============================================================
	// Step 1: 连接区块链 RPC 节点
	// ============================================================
	ethereumConn, err := ethclient.Dial(network)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	// ============================================================
	// Step 2: 实例化 PledgePool 合约绑定对象
	// bindings.NewPledgePoolToken 是由 abigen 工具根据 ABI 自动生成的
	// ============================================================
	pledgePoolToken, err := bindings.NewPledgePoolToken(common.HexToAddress(contractAddress), ethereumConn)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	// ============================================================
	// Step 3: 读取全局手续费率
	// 对应 PledgePool.sol 中的 public 变量 borrowFee 和 lendFee
	// 这些费率在池子结束时扣除，单位是 1e6 (如 250000 = 25%)
	// ============================================================
	borrowFee, err := pledgePoolToken.PledgePoolTokenCaller.BorrowFee(nil)
	lendFee, err := pledgePoolToken.PledgePoolTokenCaller.LendFee(nil)

	// ============================================================
	// Step 4: 获取池子总数
	// 对应 PledgePool.sol 中的 poolLength() 函数
	// ============================================================
	pLength, err := pledgePoolToken.PledgePoolTokenCaller.PoolLength(nil)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	// ============================================================
	// Step 5: 遍历所有池子，同步数据
	// 注意：合约中池子索引从 0 开始，但数据库中 pool_id 从 1 开始
	// ============================================================
	for i := 0; i <= int(pLength.Int64())-1; i++ {

		log.Logger.Sugar().Info("UpdatePoolInfo ", i)
		poolId := utils.IntToString(i + 1) // 数据库中的 pool_id = 合约索引 + 1

		// ------------------------------------------------------------
		// 5.1: 读取池子基础信息 (PoolBaseInfo)
		// 对应 PledgePool.sol 中的 poolBaseInfo 数组
		// 包含: settleTime, endTime, interestRate, maxSupply, state 等
		// ------------------------------------------------------------
		baseInfo, err := pledgePoolToken.PledgePoolTokenCaller.PoolBaseInfo(nil, big.NewInt(int64(i)))
		if err != nil {
			log.Logger.Sugar().Info("UpdatePoolInfo PoolBaseInfo err", poolId, err)
			continue
		}

		// ------------------------------------------------------------
		// 5.2: 从数据库获取代币元信息 (Logo, Symbol, Price)
		// 这些信息由 tokenPriceService 和 tokenSymbolService 维护
		// ------------------------------------------------------------
		_, borrowToken := models.NewTokenInfo().GetTokenInfo(baseInfo.BorrowToken.String(), chainId)
		_, lendToken := models.NewTokenInfo().GetTokenInfo(baseInfo.LendToken.String(), chainId)

		// ------------------------------------------------------------
		// 5.3: 构造 JSON 格式的代币信息，供前端直接使用
		// ------------------------------------------------------------
		lendTokenJson, _ := json.Marshal(models.LendToken{
			LendFee:    lendFee.String(),
			TokenLogo:  lendToken.Logo,
			TokenName:  lendToken.Symbol,
			TokenPrice: lendToken.Price,
		})
		borrowTokenJson, _ := json.Marshal(models.BorrowToken{
			BorrowFee:  borrowFee.String(),
			TokenLogo:  borrowToken.Logo,
			TokenName:  borrowToken.Symbol,
			TokenPrice: borrowToken.Price,
		})

		// ------------------------------------------------------------
		// 5.4: 组装 PoolBase 结构体
		// 映射关系: 合约 PoolBaseInfo struct --> Go PoolBase struct --> MySQL poolbases 表
		// ------------------------------------------------------------
		poolBase := models.PoolBase{
			SettleTime:             baseInfo.SettleTime.String(),             // 结算时间 (Unix 时间戳)
			PoolId:                 utils.StringToInt(poolId),                // 池子 ID
			ChainId:                chainId,                                  // 链 ID
			EndTime:                baseInfo.EndTime.String(),                // 结束时间 (Unix 时间戳)
			InterestRate:           baseInfo.InterestRate.String(),           // 固定利率 (1e8 精度)
			MaxSupply:              baseInfo.MaxSupply.String(),              // 最大供给量 (wei)
			LendSupply:             baseInfo.LendSupply.String(),             // 已存入的出借金额 (wei)
			BorrowSupply:           baseInfo.BorrowSupply.String(),           // 已存入的抵押品金额 (wei)
			MartgageRate:           baseInfo.MartgageRate.String(),           // 抵押率 (1e8 精度)
			LendToken:              baseInfo.LendToken.String(),              // 出借代币地址
			LendTokenSymbol:        lendToken.Symbol,                         // 出借代币符号 (如 BUSD)
			LendTokenInfo:          string(lendTokenJson),                    // 出借代币详情 JSON
			BorrowToken:            baseInfo.BorrowToken.String(),            // 抵押代币地址
			BorrowTokenSymbol:      borrowToken.Symbol,                       // 抵押代币符号 (如 BTC)
			BorrowTokenInfo:        string(borrowTokenJson),                  // 抵押代币详情 JSON
			State:                  utils.IntToString(int(baseInfo.State)),   // 池子状态: 0=MATCH, 1=EXECUTION, 2=FINISH, 3=LIQUIDATION, 4=UNDONE
			SpCoin:                 baseInfo.SpCoin.String(),                 // SP Token 地址 (出借人凭证)
			JpCoin:                 baseInfo.JpCoin.String(),                 // JP Token 地址 (借款人凭证)
			AutoLiquidateThreshold: baseInfo.AutoLiquidateThreshold.String(), // 自动清算阈值 (1e8 精度)
		}

		// ------------------------------------------------------------
		// 5.5: 增量更新检测 - 使用 MD5 比较缓存数据
		// 只有当数据发生变化时才写入数据库，减少不必要的 IO
		// ------------------------------------------------------------
		hasInfoData, byteBaseInfoStr, baseInfoMd5Str := s.GetPoolMd5(&poolBase, "base_info:pool_"+chainId+"_"+poolId)
		if !hasInfoData || (baseInfoMd5Str != byteBaseInfoStr) {
			// 数据有变化，写入 MySQL
			err = models.NewPoolBase().SavePoolBase(chainId, poolId, &poolBase)
			if err != nil {
				log.Logger.Sugar().Error("SavePoolBase err ", chainId, poolId)
			}
			// 更新 Redis 缓存，设置 30 分钟过期时间防止 hash 碰撞
			_ = db.RedisSet("base_info:pool_"+chainId+"_"+poolId, baseInfoMd5Str, 60*30)
		}

		// ------------------------------------------------------------
		// 5.6: 读取池子动态数据 (PoolDataInfo)
		// 对应 PledgePool.sol 中的 poolDataInfo 数组
		// 包含: 结算金额、清算金额、完成金额等运行时数据
		// ------------------------------------------------------------
		dataInfo, err := pledgePoolToken.PledgePoolTokenCaller.PoolDataInfo(nil, big.NewInt(int64(i)))
		if err != nil {
			log.Logger.Sugar().Info("UpdatePoolInfo PoolDataInfo err", poolId, err)
			continue
		}

		// ------------------------------------------------------------
		// 5.7: 增量更新 PoolData
		// ------------------------------------------------------------
		hasPoolData, byteDataInfoStr, dataInfoMd5Str := s.GetPoolMd5(&poolBase, "data_info:pool_"+chainId+"_"+poolId)
		if !hasPoolData || (dataInfoMd5Str != byteDataInfoStr) {
			poolData := models.PoolData{
				PoolId:                 poolId,
				ChainId:                chainId,
				FinishAmountBorrow:     dataInfo.FinishAmountBorrow.String(),     // 正常结束时借款人可提取的抵押品
				FinishAmountLend:       dataInfo.FinishAmountLend.String(),       // 正常结束时出借人可提取的本金+利息
				LiquidationAmounBorrow: dataInfo.LiquidationAmounBorrow.String(), // 清算时借款人剩余抵押品
				LiquidationAmounLend:   dataInfo.LiquidationAmounLend.String(),   // 清算时出借人可提取的金额
				SettleAmountBorrow:     dataInfo.SettleAmountBorrow.String(),     // 结算时锁定的抵押品数量
				SettleAmountLend:       dataInfo.SettleAmountLend.String(),       // 结算时锁定的出借金额
			}
			err = models.NewPoolData().SavePoolData(chainId, poolId, &poolData)
			if err != nil {
				log.Logger.Sugar().Error("SavePoolData err ", chainId, poolId)
			}
			_ = db.RedisSet("data_info:pool_"+chainId+"_"+poolId, dataInfoMd5Str, 60*30)
		}
	}
}

// GetPoolMd5 - 计算池子数据的 MD5 哈希，用于增量更新检测
//
// 参数:
//   - baseInfo: 池子基础信息结构体
//   - key: Redis 缓存 Key
//
// 返回:
//   - hasData: Redis 中是否已有缓存
//   - cachedMd5: Redis 中缓存的 MD5 值
//   - currentMd5: 当前数据的 MD5 值
//
// 原理: 比较 cachedMd5 和 currentMd5，如果不同则说明链上数据已更新
func (s *poolService) GetPoolMd5(baseInfo *models.PoolBase, key string) (bool, string, string) {
	baseInfoBytes, _ := json.Marshal(baseInfo)
	baseInfoMd5Str := utils.Md5(string(baseInfoBytes))
	resInfoBytes, _ := db.RedisGet(key)
	if len(resInfoBytes) > 0 {
		return true, strings.Trim(string(resInfoBytes), `"`), baseInfoMd5Str
	} else {
		return false, strings.Trim(string(resInfoBytes), `"`), baseInfoMd5Str
	}
}
