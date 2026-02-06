// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../multiSignature/multiSignatureClient.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract BscPledgeOracle is multiSignatureClient {
    // 资产到 Chainlink 预言机的映射
    mapping(uint256 => AggregatorV3Interface) internal assetsMap;
    // 资产到其对应小数精度的映射
    mapping(uint256 => uint256) internal decimalsMap;
    // 资产到手动设置价格的映射 (当没有预言机时作为备用或主用)
    mapping(uint256 => uint256) internal priceMap;
    // 全局价格精度除数，默认为 1
    uint256 internal decimals = 1;

    constructor(
        address multiSignature
    ) public multiSignatureClient(multiSignature) {
        //        //  bnb/USD
        //        assetsMap[uint256(0x0000000000000000000000000000000000000000)] = AggregatorV3Interface(0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526);
        //        // DAI/USD
        //        assetsMap[uint256(0xf2bDB4ba16b7862A1bf0BE03CD5eE25147d7F096)] = AggregatorV3Interface(0xE4eE17114774713d2De0eC0f035d4F7665fc025D);
        //        // BTC/USD
        //        assetsMap[uint256(0xF592aa48875a5FDE73Ba64B527477849C73787ad)] = AggregatorV3Interface(0x5741306c21795FdCBb9b265Ea0255F499DFe515C);
        //        // BUSD/USD
        //        assetsMap[uint256(0xDc6dF65b2fA0322394a8af628Ad25Be7D7F413c2)] = AggregatorV3Interface(0x9331b55D9830EF609A2aBCfAc0FBCE050A52fdEa);
        //
        //
        //        decimalsMap[uint256(0x0000000000000000000000000000000000000000)] = 18;
        //        decimalsMap[uint256(0xf2bDB4ba16b7862A1bf0BE03CD5eE25147d7F096)] = 18;
        //        decimalsMap[uint256(0xF592aa48875a5FDE73Ba64B527477849C73787ad)] = 18;
        //        decimalsMap[uint256(0xDc6dF65b2fA0322394a8af628Ad25Be7D7F413c2)] = 18;
    }

    /**
     * @notice 设置全局价格精度除数
     * @dev 用于调整所有价格的计算基准。
     * 这是一个敏感操作，需要多签权限 (validCall)。
     * @param newDecimals 新的精度除数
     */
    function setDecimals(uint256 newDecimals) public validCall {
        decimals = newDecimals;
    }

    /**
     * @notice 批量设置资产价格
     * @dev 用于在没有 Chainlink 预言机的情况下，由管理员直接喂价。
     * @param assets 资产 ID 数组 (虽然这里类型是 uint256，但实际通常是地址转为的 uint256)
     * @param prices 对应的价格数组
     */
    function setPrices(uint256[]memory assets,uint256[]memory prices) external validCall {
        require(assets.length == prices.length, "input arrays' length are not equal");
        uint256 len = assets.length;
        for (uint i=0;i<len;i++){
            priceMap[i] = prices[i];
        }
    }

    /**
     * @notice 批量获取资产价格
     * @dev 根据资产 ID 列表返回对应的价格数组
     * @param  assets 要查询价格的资产 ID 列表
     * @return 资产价格数组（通常放大缩放过，例如 1e8）
     */
    function getPrices(
        uint256[] memory assets
    ) public view returns (uint256[] memory) {
        uint256 len = assets.length;
        uint256[] memory prices = new uint256[](len);
        for (uint i = 0; i < len; i++) {
            prices[i] = getUnderlyingPrice(assets[i]);
        }
        return prices;
    }

    /**
     * @notice 获取单个资产的价格 (输入为地址)
     * @dev 包装函数，将 address 转换为 uint256 后调用底层获取价格逻辑
     * @param asset 资产地址
     * @return 资产价格
     */
    function getPrice(address asset) public view returns (uint256) {
        return getUnderlyingPrice(uint256(asset));
    }

    /**
     * @notice 获取单个底层资产的价格 (输入为 uint256 ID)
     * @dev 核心价格获取逻辑。优先尝试从 Chainlink 获取，如果未配置 Chainlink，则回退到 priceMap 配置的手动价格。
     * @param underlying 底层资产 ID
     * @return 资产价格
     */
    function getUnderlyingPrice(
        uint256 underlying
    ) public view returns (uint256) {
        AggregatorV3Interface assetsPrice = assetsMap[underlying];
        // 如果配置了 Chainlink 预言机
        if (address(assetsPrice) != address(0)) {
            (, int price, , , ) = assetsPrice.latestRoundData(); // 获取最新一轮数据
            uint256 tokenDecimals = decimalsMap[underlying]; // 获取该资产在 Chainlink 上的精度

            // 下面的逻辑是为了将不同同精度的价格统一归一化 (通常目标是 18 位或其他标准)
            if (tokenDecimals < 18) {
                return
                    (uint256(price) / decimals) * (10 ** (18 - tokenDecimals));
            } else if (tokenDecimals > 18) {
                return uint256(price) / decimals / (10 ** (18 - tokenDecimals));
            } else {
                return uint256(price) / decimals;
            }
        } else {
            // 如果没有 Chainlink，使用管理员手动设置的兜底价格
            return priceMap[underlying];
        }
    }

    /**
     * @notice 设置单个资产的价格 (输入为地址)
     * @dev 管理员手动喂价接口
     * @param asset 资产地址
     * @param price 资产价格
     */
    function setPrice(address asset, uint256 price) public validCall {
        priceMap[uint256(asset)] = price;
    }

    /**
     * @notice 设置单个底层资产的价格 (输入为 uint256 ID)
     * @dev 管理员手动喂价接口
     * @param underlying 底层资产 ID
     * @param price 底层资产价格
     */
    function setUnderlyingPrice(
        uint256 underlying,
        uint256 price
    ) public validCall {
        require(underlying > 0, "underlying cannot be zero"); // ID 不能为 0
        priceMap[underlying] = price;
    }

    /**
     * @notice 为资产设置 Chainlink 聚合器
     * @dev 用于关联资产和 Chainlink 预言机合约地址
     * @param asset 资产地址
     * @param aggergator Chainlink 聚合器地址
     * @param _decimals 该聚合器返回价格的小数精度
     */
    function setAssetsAggregator(
        address asset,
        address aggergator,
        uint256 _decimals
    ) public validCall {
        assetsMap[uint256(asset)] = AggregatorV3Interface(aggergator);
        decimalsMap[uint256(asset)] = _decimals;
    }

    /**
     * @notice 为底层资产设置 Chainlink 聚合器 (输入为 uint256 ID)
     * @dev 重载函数，用 ID 而不是地址
     * @param underlying 底层资产 ID
     * @param aggergator Chainlink 聚合器地址
     * @param _decimals 该聚合器返回价格的小数精度
     */
    function setUnderlyingAggregator(
        uint256 underlying,
        address aggergator,
        uint256 _decimals
    ) public validCall {
        require(underlying > 0, "underlying cannot be zero");
        assetsMap[underlying] = AggregatorV3Interface(aggergator);
        decimalsMap[underlying] = _decimals;
    }

    /** @notice 获取资产对应的聚合器信息 (输入为地址)
     * @dev 查询资产绑定的预言机地址和精度
     * @param asset 资产地址
     * @return 聚合器地址 和 精度
     */
    function getAssetsAggregator(
        address asset
    ) public view returns (address, uint256) {
        return (
            address(assetsMap[uint256(asset)]),
            decimalsMap[uint256(asset)]
        );
    }

    /**
     * @notice 获取底层资产对应的聚合器信息 (输入为 uint256 ID)
     * @dev 查询资产绑定的预言机地址和精度
     * @param underlying 底层资产 ID
     * @ return 聚合器地址 和 精度
     */
    function getUnderlyingAggregator(
        uint256 underlying
    ) public view returns (address, uint256) {
        return (address(assetsMap[underlying]), decimalsMap[underlying]);
    }
}
