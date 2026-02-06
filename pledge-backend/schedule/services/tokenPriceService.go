/*
 * ==================================================================================
 * tokenPriceService.go - 代币价格同步服务
 * ==================================================================================
 *
 * 【核心功能】
 * 该服务负责从区块链上的 BscPledgeOracle 智能合约读取代币价格，
 * 并将价格数据同步到 MySQL 和 Redis 中。同时，它也负责将 PLGR 代币价格
 * 写入链上 Oracle 合约（这是后端唯一的链上写操作）。
 *
 * 【调用频率】
 * - UpdateContractPrice(): 每 1 分钟调用一次（读取链上价格）
 * - SavePlgrPrice() / SavePlgrPriceTestNet(): 每 30 分钟调用一次（写入链上价格）
 *
 * 【与智能合约的关系】
 * - 读取: 调用 BscPledgeOracle.sol 的 getPrice(address) 获取代币价格
 * - 写入: 调用 BscPledgeOracle.sol 的 setPrice(address, uint256) 设置 PLGR 价格
 *
 * 【数据流向】
 * 读取: BscPledgeOracle.sol --> tokenPriceService --> MySQL (token_info.price) + Redis
 * 写入: KuCoin Exchange --> Redis --> tokenPriceService --> BscPledgeOracle.sol
 * ==================================================================================
 */

package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"pledge-backend/config"
	"pledge-backend/contract/bindings"
	"pledge-backend/db"
	"pledge-backend/log"
	serviceCommon "pledge-backend/schedule/common"
	"pledge-backend/schedule/models"
	"pledge-backend/utils"
	"time"

	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/ethereum/go-ethereum/ethclient"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// TokenPrice - 代币价格服务结构体
type TokenPrice struct{}

// NewTokenPrice - 工厂函数，创建 TokenPrice 实例
func NewTokenPrice() *TokenPrice {
	return &TokenPrice{}
}

// UpdateContractPrice - 从链上 Oracle 合约读取所有代币的价格并同步到数据库
// 【定时任务】每 1 分钟执行一次
//
// 执行流程:
//  1. 从 MySQL token_info 表查询所有已注册的代币
//  2. 遍历每个代币，调用 BscPledgeOracle.getPrice(tokenAddress) 获取链上价格
//  3. 比较价格是否变化（通过 Redis 缓存）
//  4. 如果价格有变化，更新 MySQL 和 Redis
//
// 注意: 主网代码已注释，当前仅同步测试网
func (s *TokenPrice) UpdateContractPrice() {
	// Step 1: 从数据库获取所有已注册的代币列表
	var tokens []models.TokenInfo
	db.Mysql.Table("token_info").Find(&tokens)

	// Step 2: 遍历每个代币
	for _, t := range tokens {

		var err error
		var price int64 = 0

		// Step 3: 根据 chainId 调用对应网络的 Oracle 合约
		if t.Token == "" {
			log.Logger.Sugar().Error("UpdateContractPrice token empty ", t.Symbol, t.ChainId)
			continue
		} else {
			if t.ChainId == config.Config.TestNet.ChainId {
				// 测试网: 调用 BscPledgeOracle (TestNet) 获取价格
				err, price = s.GetTestNetTokenPrice(t.Token)
			} else if t.ChainId == "56" {
				// 主网: 已禁用
				// 注释掉的代码展示了主网的特殊处理逻辑:
				// 对于 PLGR 代币，价格从 KuCoin 交易所获取（存储在 Redis）
				// 其他代币从 Oracle 合约获取
			}

			if err != nil {
				log.Logger.Sugar().Error("UpdateContractPrice err ", t.Symbol, t.ChainId, err)
				continue
			}
		}

		// Step 4: 检查价格是否有变化
		hasNewData, err := s.CheckPriceData(t.Token, t.ChainId, utils.Int64ToString(price))
		if err != nil {
			log.Logger.Sugar().Error("UpdateContractPrice CheckPriceData err ", err)
			continue
		}

		// Step 5: 如果价格有变化，保存到 MySQL
		if hasNewData {
			err = s.SavePriceData(t.Token, t.ChainId, utils.Int64ToString(price))
			if err != nil {
				log.Logger.Sugar().Error("UpdateContractPrice SavePriceData err ", err)
				continue
			}
		}
	}
}

// GetMainNetTokenPrice - 从主网 BscPledgeOracle 合约获取代币价格
//
// 参数:
//   - token: 代币合约地址
//
// 返回:
//   - error: 错误信息
//   - int64: 代币价格 (1e8 精度，如 4177240269365 表示 BTC 约 $41772)
//
// 对应合约: BscPledgeOracle.sol 的 getPrice(address) 或 getUnderlyingPrice(uint256)
func (s *TokenPrice) GetMainNetTokenPrice(token string) (error, int64) {
	ethereumConn, err := ethclient.Dial(config.Config.MainNet.NetUrl)
	if nil != err {
		log.Logger.Error(err.Error())
		return err, 0
	}

	// 实例化 BscPledgeOracle 合约绑定
	bscPledgeOracleMainNetToken, err := bindings.NewBscPledgeOracleMainnetToken(common.HexToAddress(config.Config.MainNet.BscPledgeOracleToken), ethereumConn)
	if nil != err {
		log.Logger.Error(err.Error())
		return err, 0
	}

	// 调用合约的 GetPrice 函数
	price, err := bscPledgeOracleMainNetToken.GetPrice(nil, common.HexToAddress(token))
	if err != nil {
		log.Logger.Error(err.Error())
		return err, 0
	}

	return nil, price.Int64()
}

// GetTestNetTokenPrice - 从测试网 BscPledgeOracle 合约获取代币价格
//
// 参数:
//   - token: 代币合约地址
//
// 返回:
//   - error: 错误信息
//   - int64: 代币价格 (1e8 精度)
//
// 对应合约: BscPledgeOracle.sol (TestNet) 的 getPrice(address)
func (s *TokenPrice) GetTestNetTokenPrice(token string) (error, int64) {
	ethereumConn, err := ethclient.Dial(config.Config.TestNet.NetUrl)
	if nil != err {
		log.Logger.Error(err.Error())
		return err, 0
	}

	// 实例化 BscPledgeOracle 合约绑定 (TestNet)
	bscPledgeOracleTestnetToken, err := bindings.NewBscPledgeOracleTestnetToken(common.HexToAddress(config.Config.TestNet.BscPledgeOracleToken), ethereumConn)
	if nil != err {
		log.Logger.Error(err.Error())
		return err, 0
	}

	// 调用合约的 GetPrice 函数
	price, err := bscPledgeOracleTestnetToken.GetPrice(nil, common.HexToAddress(token))
	if nil != err {
		log.Logger.Error(err.Error())
		return err, 0
	}

	return nil, price.Int64()
}

// CheckPriceData - 检查价格是否有变化，并更新 Redis 缓存
// 这是增量更新的核心逻辑，避免频繁写入数据库
func (s *TokenPrice) CheckPriceData(token, chainId, price string) (bool, error) {
	redisKey := "token_info:" + chainId + ":" + token
	redisTokenInfoBytes, err := db.RedisGet(redisKey)
	if len(redisTokenInfoBytes) <= 0 {
		err = s.CheckTokenInfo(token, chainId)
		if err != nil {
			log.Logger.Error(err.Error())
		}
		err = db.RedisSet(redisKey, models.RedisTokenInfo{
			Token:   token,
			ChainId: chainId,
			Price:   price,
		}, 0)
		if err != nil {
			log.Logger.Error(err.Error())
			return false, err
		}
	} else {
		redisTokenInfo := models.RedisTokenInfo{}
		err = json.Unmarshal(redisTokenInfoBytes, &redisTokenInfo)
		if err != nil {
			log.Logger.Error(err.Error())
			return false, err
		}

		if redisTokenInfo.Price == price {
			return false, nil
		}

		redisTokenInfo.Price = price
		err = db.RedisSet(redisKey, redisTokenInfo, 0)
		if err != nil {
			log.Logger.Error(err.Error())
			return true, err
		}
	}
	return true, nil
}

// CheckTokenInfo  Insert token information if it was not in mysql
func (s *TokenPrice) CheckTokenInfo(token, chainId string) error {
	tokenInfo := models.TokenInfo{}
	err := db.Mysql.Table("token_info").Where("token=? and chain_id=?", token, chainId).First(&tokenInfo).Debug().Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			tokenInfo = models.TokenInfo{}
			nowDateTime := utils.GetCurDateTimeFormat()
			tokenInfo.Token = token
			tokenInfo.ChainId = chainId
			tokenInfo.UpdatedAt = nowDateTime
			tokenInfo.CreatedAt = nowDateTime
			err = db.Mysql.Table("token_info").Create(tokenInfo).Debug().Error
			if err != nil {
				return err
			}
		} else {
			return err
		}
	}
	return nil
}

// SavePriceData Saving price data to mysql if it has new price
func (s *TokenPrice) SavePriceData(token, chainId, price string) error {

	nowDateTime := utils.GetCurDateTimeFormat()

	err := db.Mysql.Table("token_info").Where("token=? and chain_id=? ", token, chainId).Updates(map[string]interface{}{
		"price":      price,
		"updated_at": nowDateTime,
	}).Debug().Error
	if err != nil {
		log.Logger.Sugar().Error("UpdateContractPrice SavePriceData err ", err)
		return err
	}

	return nil
}

// SavePlgrPrice - 将 PLGR 代币价格写入主网 Oracle 合约
// 【链上写操作】这是后端唯一的链上写操作！
// 【定时任务】每 30 分钟执行一次
//
// 执行流程:
//  1. 从 Redis 读取 PLGR 价格（由 kucoin.GetExchangePrice 写入）
//  2. 转换价格精度 (乘以 1e8)
//  3. 使用 Admin 私钥签名交易
//  4. 调用 BscPledgeOracle.setPrice(plgrAddress, price) 写入链上
//
// 【安全警告】Admin 私钥直接硬编码在代码中，存在严重安全隐患！
// 生产环境应使用 HSM、Vault 或环境变量管理私钥。
func (s *TokenPrice) SavePlgrPrice() {
	// Step 1: 从 Redis 读取 KuCoin 上的 PLGR 价格
	priceStr, _ := db.RedisGetString("plgr_price")
	priceF, _ := decimal.NewFromString(priceStr)

	// Step 2: 转换精度 (价格 * 1e8)
	// Oracle 合约使用 1e8 精度存储价格
	e8 := decimal.NewFromInt(100000000)
	priceF = priceF.Mul(e8)
	price := priceF.IntPart()

	// Step 3: 连接区块链 RPC 节点
	ethereumConn, err := ethclient.Dial(config.Config.MainNet.NetUrl)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	// Step 4: 实例化 BscPledgeOracle 合约绑定
	bscPledgeOracleMainNetToken, err := bindings.NewBscPledgeOracleMainnetToken(common.HexToAddress(config.Config.MainNet.BscPledgeOracleToken), ethereumConn)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	// Step 5: 加载 Admin 私钥
	// ⚠️ 警告: 私钥硬编码在 schedule/common 包中，这是不安全的做法
	privateKeyEcdsa, err := crypto.HexToECDSA(serviceCommon.PlgrAdminPrivateKey)
	if err != nil {
		log.Logger.Error(err.Error())
		return
	}

	// Step 6: 创建交易签名者
	auth, err := bind.NewKeyedTransactorWithChainID(privateKeyEcdsa, big.NewInt(utils.StringToInt64(config.Config.MainNet.ChainId)))
	if err != nil {
		log.Logger.Error(err.Error())
		return
	}

	// Step 7: 设置交易超时时间 (5秒)
	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	// Step 8: 构造交易参数
	transactOpts := bind.TransactOpts{
		From:      auth.From,
		Nonce:     nil,         // 自动获取 nonce
		Signer:    auth.Signer, // 交易签名方法
		Value:     big.NewInt(0),
		GasPrice:  nil, // 自动估算 gas price
		GasFeeCap: nil,
		GasTipCap: nil,
		GasLimit:  0, // 自动估算 gas limit
		Context:   ctx,
		NoSend:    false, // true = 模拟交易, false = 实际发送
	}

	// Step 9: 调用合约的 SetPrice 函数
	// 对应 BscPledgeOracle.sol 的 setPrice(address, uint256)
	_, err = bscPledgeOracleMainNetToken.SetPrice(&transactOpts, common.HexToAddress(config.Config.MainNet.PlgrAddress), big.NewInt(price))

	log.Logger.Sugar().Info("SavePlgrPrice ", err)

	// Step 10: 验证价格是否写入成功
	a, d := s.GetMainNetTokenPrice(config.Config.MainNet.PlgrAddress)
	log.Logger.Sugar().Info("GetMainNetTokenPrice ", a, d)
}

// SavePlgrPriceTestNet - 将 PLGR 代币价格写入测试网 Oracle 合约
// 【链上写操作】测试网版本
// 【定时任务】每 30 分钟执行一次
//
// 与主网版本的区别:
//   - 使用固定测试价格 22222 而非从 KuCoin 获取
//   - 连接测试网 RPC
//   - 使用测试网 Chain ID
func (s *TokenPrice) SavePlgrPriceTestNet() {

	// 测试网使用固定价格 22222 (仅用于测试)
	price := 22222

	// 连接测试网 RPC
	ethereumConn, err := ethclient.Dial(config.Config.TestNet.NetUrl)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	// 实例化 BscPledgeOracle 合约绑定 (TestNet)
	bscPledgeOracleTestNetToken, err := bindings.NewBscPledgeOracleMainnetToken(common.HexToAddress(config.Config.TestNet.BscPledgeOracleToken), ethereumConn)
	if nil != err {
		log.Logger.Error(err.Error())
		return
	}

	// 加载 Admin 私钥
	privateKeyEcdsa, err := crypto.HexToECDSA(serviceCommon.PlgrAdminPrivateKey)
	if err != nil {
		log.Logger.Error(err.Error())
		return
	}

	// 创建交易签名者 (使用测试网 Chain ID)
	auth, err := bind.NewKeyedTransactorWithChainID(privateKeyEcdsa, big.NewInt(utils.StringToInt64(config.Config.TestNet.ChainId)))
	if err != nil {
		log.Logger.Error(err.Error())
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), time.Second*5)
	defer cancel()

	transactOpts := bind.TransactOpts{
		From:      auth.From,
		Nonce:     nil,
		Signer:    auth.Signer,
		Value:     big.NewInt(0),
		GasPrice:  nil,
		GasFeeCap: nil,
		GasTipCap: nil,
		GasLimit:  0,
		Context:   ctx,
		NoSend:    false,
	}

	// 调用合约的 SetPrice 函数写入测试价格
	_, err = bscPledgeOracleTestNetToken.SetPrice(&transactOpts, common.HexToAddress(config.Config.TestNet.PlgrAddress), big.NewInt(int64(price)))

	log.Logger.Sugar().Info("SavePlgrPrice ", err)

	// 验证价格是否写入成功
	a, d := s.GetTestNetTokenPrice(config.Config.TestNet.PlgrAddress)
	fmt.Println(a, d, 5555)
}
