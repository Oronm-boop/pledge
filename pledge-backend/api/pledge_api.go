/*
 * ==================================================================================
 * pledge_api.go - Pledge API 服务入口
 * ==================================================================================
 *
 * 【核心功能】
 * 这是 Pledge 后端 API 服务的主入口文件。它负责：
 * 1. 初始化数据库连接 (MySQL, Redis)
 * 2. 启动 WebSocket 服务 (用于实时价格推送)
 * 3. 启动 KuCoin 价格获取协程 (获取 PLGR 交易所价格)
 * 4. 配置并启动 Gin Web 服务器
 *
 * 【服务架构】
 * Pledge 后端由两个独立的 Go 服务组成 (可分开部署):
 * - pledge_api.go: HTTP API 服务 (本文件)
 * - pledge_task.go: 定时任务服务 (schedule 模块)
 *
 * 【启动命令】
 * go run pledge_api.go
 *
 * 【默认端口】
 * HTTP API: 由 config.Config.Env.Port 配置 (默认 8081)
 * WebSocket: ws.StartServer() 内部配置
 * ==================================================================================
 */

package main

import (
	"pledge-backend/api/middlewares"
	"pledge-backend/api/models"
	"pledge-backend/api/models/kucoin"
	"pledge-backend/api/models/ws"
	"pledge-backend/api/routes"
	"pledge-backend/api/static"
	"pledge-backend/api/validate"
	"pledge-backend/config"
	"pledge-backend/db"

	"github.com/gin-gonic/gin"
)

func main() {

	// ============================================================
	// Step 1: 初始化数据库连接
	// ============================================================

	// 初始化 MySQL 连接 (用于持久化存储)
	db.InitMysql()

	// 初始化 Redis 连接 (用于缓存和实时数据)
	db.InitRedis()

	// 创建数据库表 (如果不存在)
	models.InitTable()

	// ============================================================
	// Step 2: 初始化验证器
	// ============================================================

	// 将 go-playground-validator 绑定到 Gin
	validate.BindingValidator()

	// ============================================================
	// Step 3: 启动后台协程 (Goroutines)
	// ============================================================

	// 启动 WebSocket 服务器 (用于实时价格推送等)
	go ws.StartServer()

	// 启动 KuCoin 价格获取服务
	// 该服务定期从 KuCoin 交易所获取 PLGR 价格并存入 Redis
	// 然后由 tokenPriceService.SavePlgrPrice() 写入链上 Oracle
	go kucoin.GetExchangePrice()

	// ============================================================
	// Step 4: 配置并启动 Gin Web 服务器
	// ============================================================

	// 设置 Gin 为发布模式 (关闭调试日志)
	gin.SetMode(gin.ReleaseMode)

	// 创建 Gin 实例
	app := gin.Default()

	// 配置静态文件服务 (代币 Logo 等资源)
	staticPath := static.GetCurrentAbPathByCaller()
	app.Static("/storage/", staticPath)

	// 配置 CORS 中间件 (允许跨域请求)
	app.Use(middlewares.Cors())

	// 注册所有 API 路由
	routes.InitRoute(app)

	// 启动 HTTP 服务器
	// 监听端口由 config.Config.Env.Port 配置
	_ = app.Run(":" + config.Config.Env.Port)

}

/*
 如果更改版本号，需要修改以下文件:
 config/init.go
*/
