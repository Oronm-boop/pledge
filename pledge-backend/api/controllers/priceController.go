/*
 * ==================================================================================
 * priceController.go - WebSocket 价格推送控制器
 * ==================================================================================
 *
 * 【核心功能】
 * 该控制器负责处理前端的 WebSocket 连接请求。
 * 当客户端请求 /api/v{version}/price 时，会将 HTTP 连接升级为 WebSocket 连接，
 * 然后该连接会被纳入全局连接池，自动接收实时价格推送。
 *
 * 【工作流程】
 * 1. 客户端发起 HTTP GET 请求: ws://host:port/api/v{version}/price
 * 2. NewPrice() 将 HTTP 升级为 WebSocket
 * 3. 创建 ws.Server 实例，注册到全局连接池
 * 4. 启动 ReadAndWrite() 协程处理心跳和消息
 * 5. ws.StartServer() 会自动向该连接推送价格
 *
 * 【数据流向】
 * 客户端 HTTP 请求 → NewPrice() → WebSocket 升级 → ws.Server → 接收价格推送
 *
 * 【路由配置】
 * 在 route.go 中注册: v2Group.GET("/price", priceController.NewPrice)
 * ==================================================================================
 */

package controllers

import (
	"net/http"
	"pledge-backend/api/models/ws"
	"pledge-backend/log"
	"pledge-backend/utils"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// PriceController 价格推送控制器
// 处理 WebSocket 连接请求，用于实时推送 PLGR 代币价格
type PriceController struct {
}

// NewPrice 处理 WebSocket 连接请求
//
// 【功能说明】
// 将普通 HTTP 请求升级为 WebSocket 长连接，
// 连接成功后，客户端会自动接收 PLGR/USDT 的实时价格推送。
//
// 【请求方式】
// - 方法: GET
// - 路径: /api/v{version}/price
// - 协议: 需要支持 WebSocket 升级
//
// 【连接示例】
// JavaScript:
//
//	const ws = new WebSocket('ws://localhost:8081/api/v2/price');
//	ws.onmessage = (event) => {
//	    const data = JSON.parse(event.data);
//	    console.log('Price:', data.data);
//	};
//
// 【心跳保活】
// 客户端需要定期发送 "ping" 消息保持连接，服务器会回复 "pong"。
// 超时未收到心跳，服务器会主动断开连接。
func (c *PriceController) NewPrice(ctx *gin.Context) {

	// ============================================================
	// Step 0: 异常恢复（Panic Recovery）
	// ============================================================
	// 捕获可能的 panic，防止单个连接的异常导致整个服务崩溃
	defer func() {
		recoverRes := recover()
		if recoverRes != nil {
			log.Logger.Sugar().Error("new price recover ", recoverRes)
		}
	}()

	// ============================================================
	// Step 1: HTTP 升级为 WebSocket
	// ============================================================
	// 使用 gorilla/websocket 库进行协议升级
	conn, err := (&websocket.Upgrader{
		// 读取缓冲区大小: 1KB
		ReadBufferSize: 1024,
		// 写入缓冲区大小: 1KB
		WriteBufferSize: 1024,
		// 握手超时时间: 5秒（防止恶意连接）
		HandshakeTimeout: 5 * time.Second,
		// 跨域检查: 允许所有来源
		// ⚠️ 生产环境建议根据实际需求限制来源
		CheckOrigin: func(r *http.Request) bool {
			return true // 允许所有跨域请求
		},
	}).Upgrade(ctx.Writer, ctx.Request, nil)

	// 升级失败（可能是客户端不支持 WebSocket）
	if err != nil {
		log.Logger.Sugar().Error("websocket request err:", err)
		return
	}

	// ============================================================
	// Step 2: 生成连接唯一标识符
	// ============================================================
	// 格式: {IP地址}_{随机字符串}
	// 例如: 192_168_1_100_abc123xyz...
	// 用于在日志中追踪特定连接，便于调试
	randomId := ""
	remoteIP, ok := ctx.RemoteIP()
	if ok {
		// 将 IP 中的点替换为下划线，拼接随机字符串
		randomId = strings.Replace(remoteIP.String(), ".", "_", -1) + "_" + utils.GetRandomString(23)
	} else {
		// 无法获取 IP 时，使用纯随机 ID
		randomId = utils.GetRandomString(32)
	}

	// ============================================================
	// Step 3: 创建 WebSocket Server 实例
	// ============================================================
	// 每个连接对应一个 Server 实例，包含:
	// - Id: 唯一标识符（用于日志和调试）
	// - Socket: 底层 WebSocket 连接
	// - Send: 发送消息的缓冲通道（当前未使用，预留扩展）
	// - LastTime: 最后心跳时间（用于超时检测）
	server := &ws.Server{
		Id:       randomId,
		Socket:   conn,
		Send:     make(chan []byte, 800), // 缓冲区大小 800 条消息
		LastTime: time.Now().Unix(),      // 初始化为当前时间
	}

	// ============================================================
	// Step 4: 启动连接处理协程
	// ============================================================
	// ReadAndWrite() 会:
	// 1. 将连接注册到全局连接池 (ws.Manager.Servers)
	// 2. 启动心跳检测循环
	// 3. 监听客户端消息（处理 ping/pong）
	// 4. 连接断开或超时时自动清理
	go server.ReadAndWrite()
}
