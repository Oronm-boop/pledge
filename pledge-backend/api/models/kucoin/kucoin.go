/*
 * ==================================================================================
 * kucoin.go - KuCoin 交易所价格监听服务
 * ==================================================================================
 *
 * 【核心功能】
 * 该模块通过 WebSocket 实时监听 KuCoin 交易所上 PLGR/USDT 交易对的价格，
 * 并将最新价格同步到 Redis 缓存和内存变量中，供系统其他模块使用。
 *
 * 【数据流向】
 * KuCoin 交易所 ---(WebSocket)---> GetExchangePrice()
 *     |
 *     +--> Redis 缓存 (plgr_price)     // 持久化存储，服务重启后可恢复
 *     +--> PlgrPrice 全局变量          // 内存快速访问
 *     +--> PlgrPriceChan 通道          // 用于通知 ws.go 广播给前端
 *
 * 【调用时机】
 * 在 pledge_api.go 的 main() 函数中以 Goroutine 方式启动:
 *     go kucoin.GetExchangePrice()
 *
 * 【依赖关系】
 * - ws.go: 从 PlgrPriceChan 读取价格并广播给前端用户
 * - tokenPriceService.go: 从 Redis 读取价格并写入链上 Oracle 合约
 * ==================================================================================
 */

package kucoin

import (
	"pledge-backend/db"
	"pledge-backend/log"

	"github.com/Kucoin/kucoin-go-sdk"
)

// ApiKeyVersionV2 KuCoin API 密钥版本
// KuCoin 从 2021 年起使用 V2 版本的 API 密钥
const ApiKeyVersionV2 = "2"

// PlgrPrice PLGR 代币的最新价格（内存缓存）
// 默认值 "0.0027" 是一个兜底值，实际价格会在连接成功后被覆盖
// 其他模块可以直接读取这个变量获取最新价格
var PlgrPrice = "0.0027"

// PlgrPriceChan 价格更新通道
// 当收到新价格时，会发送到这个通道
// ws.go 模块会监听这个通道，并将价格广播给所有前端用户
// 缓冲区大小为 2，防止短暂的消费延迟导致阻塞
var PlgrPriceChan = make(chan string, 2)

// GetExchangePrice 主函数：连接 KuCoin 并实时接收 PLGR 价格
//
// 【执行流程】
//  1. 从 Redis 读取上次保存的价格（容灾恢复）
//  2. 创建 KuCoin API 服务实例
//  3. 获取 WebSocket 公共令牌（无需真实 API Key）
//  4. 建立 WebSocket 连接
//  5. 订阅 PLGR-USDT 交易对
//  6. 进入死循环，持续接收价格更新
//
// 【注意事项】
//   - 此函数会阻塞运行，必须以 Goroutine 方式调用: go GetExchangePrice()
//   - 如果连接断开，函数会直接退出，不会自动重连
//   - API Key/Secret 使用占位符，因为公共行情数据不需要认证
func GetExchangePrice() {

	log.Logger.Sugar().Info("GetExchangePrice ")

	// ============================================================
	// Step 1: 从 Redis 恢复上次的价格（容灾机制）
	// ============================================================
	// 服务重启时，在连接交易所之前的空窗期，使用上次缓存的价格
	// 避免价格突然回退到默认值 "0.0027"
	price, err := db.RedisGetString("plgr_price")
	if err != nil {
		// Redis 读取失败（可能是首次启动），使用默认值
		log.Logger.Sugar().Error("get plgr price from redis err ", err)
	} else {
		// 成功读取，覆盖默认值
		PlgrPrice = price
	}

	// ============================================================
	// Step 2: 创建 KuCoin API 服务实例
	// ============================================================
	// 这里的 key/secret/passphrase 都是占位符
	// 因为我们只需要访问公共行情数据，不需要账户权限
	// KuCoin 的公共 WebSocket 端点不验证这些参数
	s := kucoin.NewApiService(
		kucoin.ApiKeyOption("key"),
		kucoin.ApiSecretOption("secret"),
		kucoin.ApiPassPhraseOption("passphrase"),
		kucoin.ApiKeyVersionOption(ApiKeyVersionV2),
	)

	// ============================================================
	// Step 3: 获取 WebSocket 公共令牌
	// ============================================================
	// 向 KuCoin REST API 请求 WebSocket 连接信息
	// 返回内容包括：WebSocket 服务器地址、连接令牌、心跳间隔等
	rsp, err := s.WebSocketPublicToken()
	if err != nil {
		log.Logger.Error(err.Error())
		return
	}

	// 解析响应，提取 WebSocket 连接令牌
	tk := &kucoin.WebSocketTokenModel{}
	if err := rsp.ReadData(tk); err != nil {
		log.Logger.Error(err.Error())
		return
	}

	// ============================================================
	// Step 4: 建立 WebSocket 长连接
	// ============================================================
	// 使用令牌创建 WebSocket 客户端
	c := s.NewWebSocketClient(tk)

	// 连接服务器，返回两个重要的通道：
	// - mc (Message Channel): 接收交易所推送的消息
	// - ec (Error Channel): 接收连接错误和断开通知
	mc, ec, err := c.Connect()
	if err != nil {
		log.Logger.Sugar().Errorf("Error: %s", err.Error())
		return
	}

	// ============================================================
	// Step 5: 订阅 PLGR-USDT 交易对
	// ============================================================
	// 创建订阅消息：监听 PLGR-USDT 的 Ticker（最新成交价）
	// 参数 false 表示非私有频道
	ch := kucoin.NewSubscribeMessage("/market/ticker:PLGR-USDT", false)
	// 预先创建取消订阅消息，用于异常退出时清理
	uch := kucoin.NewUnsubscribeMessage("/market/ticker:PLGR-USDT", false)

	// 发送订阅请求
	if err := c.Subscribe(ch); err != nil {
		log.Logger.Error(err.Error())
		return
	}

	// ============================================================
	// Step 6: 主循环 - 持续接收价格更新
	// ============================================================
	// 这是一个无限循环，会一直运行直到发生错误
	for {
		select {
		// 情况 A: 收到错误（连接断开、网络异常等）
		case err := <-ec:
			// 停止 WebSocket 客户端
			c.Stop()
			log.Logger.Sugar().Errorf("Error: %s", err.Error())
			// 尝试取消订阅（可能会失败，忽略错误）
			_ = c.Unsubscribe(uch)
			// ⚠️ 直接退出函数，不会自动重连！
			// 如果需要高可用，应该在这里添加重连逻辑
			return

		// 情况 B: 收到新的价格消息
		case msg := <-mc:
			// 解析 Ticker 数据
			// TickerLevel1Model 包含: Price(最新价), BestBid, BestAsk, Size 等
			t := &kucoin.TickerLevel1Model{}
			if err := msg.ReadData(t); err != nil {
				log.Logger.Sugar().Errorf("Failure to read: %s", err.Error())
				return
			}

			// 动作 1: 发送到通道，通知 ws.go 广播给前端
			// ⚠️ 如果通道满了（没有人读取），这里会阻塞！
			PlgrPriceChan <- t.Price

			// 动作 2: 更新内存中的全局变量
			PlgrPrice = t.Price

			// 动作 3: 持久化到 Redis
			// 参数 0 表示永不过期
			// 这样即使服务重启，也能从 Redis 恢复最后的价格
			_ = db.RedisSetString("plgr_price", PlgrPrice, 0)
		}
	}
}
