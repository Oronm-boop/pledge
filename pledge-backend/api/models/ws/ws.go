/*
 * ==================================================================================
 * ws.go - WebSocket 实时广播服务
 * ==================================================================================
 *
 * 【核心功能】
 * 该模块负责管理前端 WebSocket 连接，并将 PLGR 代币的实时价格广播给所有在线用户。
 * 它是"交易所 -> 后端 -> 前端"实时数据链路的最后一环。
 *
 * 【数据流向】
 * kucoin.go (PlgrPriceChan) ---> StartServer() ---> 所有前端 WebSocket 客户端
 *
 * 【主要职责】
 * 1. 连接管理: 维护所有在线用户的 WebSocket 连接池 (ServerManager)
 * 2. 心跳保活: 实现 Ping/Pong 机制，自动断开超时连接
 * 3. 消息广播: 从 PlgrPriceChan 读取价格，广播给所有客户端
 *
 * 【调用时机】
 * 在 pledge_api.go 的 main() 函数中以 Goroutine 方式启动:
 *     go ws.StartServer()
 *
 * 【WebSocket 消息格式】
 * {
 *   "code": 0,      // 0=成功, 1=Pong 响应, -1=错误
 *   "data": "..."   // 价格字符串或错误信息
 * }
 * ==================================================================================
 */

package ws

import (
	"encoding/json"
	"errors"
	"pledge-backend/api/models/kucoin"
	"pledge-backend/config"
	"pledge-backend/log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// ============================================================
// 消息状态码定义
// ============================================================

// SuccessCode 成功状态码
// 用于正常的价格推送消息
const SuccessCode = 0

// PongCode Pong 响应码
// 用于响应客户端的 Ping 心跳请求
const PongCode = 1

// ErrorCode 错误状态码
// 用于通知客户端发生错误（如心跳超时）
const ErrorCode = -1

// ============================================================
// 核心结构体定义
// ============================================================

// Server 单个 WebSocket 连接的封装
// 每个连接的前端用户对应一个 Server 实例
type Server struct {
	sync.Mutex                 // 互斥锁，保证并发安全（发送消息时需要加锁）
	Id         string          // 连接唯一标识符（通常是用户 ID 或随机生成的 UUID）
	Socket     *websocket.Conn // 底层 WebSocket 连接对象
	Send       chan []byte     // 发送消息的缓冲通道（用于异步发送）
	LastTime   int64           // 最后一次收到心跳的 Unix 时间戳
}

// ServerManager WebSocket 连接池管理器
// 维护所有在线用户的连接，支持并发安全的读写操作
type ServerManager struct {
	Servers    sync.Map     // 连接池，key=连接ID，value=*Server（使用 sync.Map 保证并发安全）
	Broadcast  chan []byte  // 广播通道（当前未使用，预留给未来扩展）
	Register   chan *Server // 注册通道（当前未使用，预留给未来扩展）
	Unregister chan *Server // 注销通道（当前未使用，预留给未来扩展）
}

// Message WebSocket 消息格式
// 所有发送给前端的消息都会被序列化为这个 JSON 结构
type Message struct {
	Code int    `json:"code"` // 状态码: 0=成功, 1=Pong, -1=错误
	Data string `json:"data"` // 消息内容: 价格字符串 或 "pong" 或 错误信息
}

// ============================================================
// 全局变量
// ============================================================

// Manager 全局连接池管理器
// 整个应用只有一个 Manager 实例，管理所有 WebSocket 连接
var Manager = ServerManager{}

// UserPingPongDurTime 心跳超时时间（秒）
// 如果超过这个时间没有收到客户端的 Ping，服务器会主动断开连接
// 从配置文件读取: config.Config.Env.WssTimeoutDuration
var UserPingPongDurTime = config.Config.Env.WssTimeoutDuration

// ============================================================
// Server 方法
// ============================================================

// SendToClient 向客户端发送消息
//
// 参数:
//   - data: 消息内容（价格字符串、"pong"、错误信息等）
//   - code: 状态码（SuccessCode/PongCode/ErrorCode）
//
// 线程安全: 此方法使用互斥锁保证并发安全
func (s *Server) SendToClient(data string, code int) {
	// 加锁，防止多个 Goroutine 同时写入 Socket
	s.Lock()
	defer s.Unlock()

	// 构造消息结构并序列化为 JSON
	dataBytes, err := json.Marshal(Message{
		Code: code,
		Data: data,
	})

	// 通过 WebSocket 发送文本消息
	err = s.Socket.WriteMessage(websocket.TextMessage, dataBytes)
	if err != nil {
		// 发送失败（通常是连接已断开）
		log.Logger.Sugar().Error(s.Id+" SendToClient err ", err)
	}
}

// ReadAndWrite 处理单个连接的读写和心跳检测
//
// 这是每个连接的主循环函数，负责：
// 1. 将连接注册到全局连接池
// 2. 启动读取 Goroutine（接收客户端消息）
// 3. 启动写入 Goroutine（从 Send 通道发送消息）
// 4. 主循环检测心跳超时
//
// 【生命周期】
// 函数会阻塞运行，直到发生以下情况之一:
// - 客户端断开连接
// - 心跳超时
// - 读写发生错误
func (s *Server) ReadAndWrite() {

	// 错误通道，用于在读/写 Goroutine 中传递错误到主循环
	errChan := make(chan error)

	// 将当前连接注册到全局连接池
	// 这样 StartServer() 就能遍历到这个连接并推送消息
	Manager.Servers.Store(s.Id, s)

	// 延迟清理：函数退出时执行
	defer func() {
		// 从连接池中移除
		Manager.Servers.Delete(s)
		// 关闭 WebSocket 连接
		_ = s.Socket.Close()
		// 关闭发送通道
		close(s.Send)
	}()

	// ============================================================
	// 写入 Goroutine: 从 Send 通道读取消息并发送给客户端
	// ============================================================
	go func() {
		for {
			select {
			case message, ok := <-s.Send:
				if !ok {
					// 通道已关闭，发送错误到主循环
					errChan <- errors.New("write message error")
					return
				}
				// 发送消息给客户端
				s.SendToClient(string(message), SuccessCode)
			}
		}
	}()

	// ============================================================
	// 读取 Goroutine: 接收客户端发来的消息
	// ============================================================
	go func() {
		for {
			// 阻塞读取客户端消息
			_, message, err := s.Socket.ReadMessage()
			if err != nil {
				// 读取失败（通常是客户端断开连接）
				log.Logger.Sugar().Error(s.Id+" ReadMessage err ", err)
				errChan <- err
				return
			}

			// 处理心跳请求
			// 兼容多种 Ping 格式: ping, "ping", 'ping'
			if string(message) == "ping" || string(message) == `"ping"` || string(message) == "'ping'" {
				// 更新最后心跳时间
				s.LastTime = time.Now().Unix()
				// 回复 Pong
				s.SendToClient("pong", PongCode)
			}
			// 继续读取下一条消息
			continue
		}
	}()

	// ============================================================
	// 主循环: 心跳超时检测
	// ============================================================
	for {
		select {
		// 每秒检查一次心跳状态
		case <-time.After(time.Second):
			// 计算距离上次心跳的时间差
			if time.Now().Unix()-s.LastTime >= UserPingPongDurTime {
				// 超时！通知客户端并断开连接
				s.SendToClient("heartbeat timeout", ErrorCode)
				return // 退出函数，触发 defer 清理
			}

		// 接收到读/写 Goroutine 的错误
		case err := <-errChan:
			log.Logger.Sugar().Error(s.Id, " ReadAndWrite returned ", err)
			return // 退出函数，触发 defer 清理
		}
	}
}

// ============================================================
// 全局函数
// ============================================================

// StartServer 启动 WebSocket 广播服务
//
// 【核心功能】
// 这是一个后台守护协程，负责:
// 1. 监听 kucoin.PlgrPriceChan 通道（从 KuCoin 接收价格更新）
// 2. 将新价格广播给所有在线的 WebSocket 客户端
//
// 【调用方式】
// 必须以 Goroutine 方式启动: go ws.StartServer()
//
// 【注意事项】
// - 此函数会阻塞运行（无限循环）
// - 如果没有在线用户，消息不会被发送
func StartServer() {
	log.Logger.Info("WsServer start")

	// 无限循环，持续监听价格通道
	for {
		select {
		// 从 kucoin.PlgrPriceChan 接收新价格
		// 这个通道由 kucoin.GetExchangePrice() 写入
		case price, ok := <-kucoin.PlgrPriceChan:
			if ok {
				// 遍历所有在线连接，逐个推送价格
				// Range 方法是并发安全的
				Manager.Servers.Range(func(key, value interface{}) bool {
					// 类型断言获取 Server 指针
					value.(*Server).SendToClient(price, SuccessCode)
					// 返回 true 继续遍历下一个连接
					return true
				})
			}
		}
	}
}
