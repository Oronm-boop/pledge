/*
 * ==================================================================================
 * route.go - API 路由配置
 * ==================================================================================
 *
 * 【核心功能】
 * 该文件定义了 Pledge 后端所有的 HTTP API 路由。
 * 包括公开接口、需要身份验证的接口、以及 WebSocket 接口。
 *
 * 【路由分组】
 * 所有路由统一使用版本前缀: /api/v{version}
 * 版本号从配置文件读取: config.Config.Env.Version
 *
 * 【接口分类】
 * 1. 质押池信息（Pool） - 公开接口，无需登录
 * 2. 价格推送（Price） - WebSocket 接口，用于实时价格
 * 3. 多签管理（MultiSign） - 管理接口，需要 Token 验证
 * 4. 用户认证（User） - 登录/登出
 *
 * 【中间件】
 * - middlewares.CheckToken(): 验证 JWT Token，限制管理员访问
 * ==================================================================================
 */

package routes

import (
	"pledge-backend/api/controllers"
	"pledge-backend/api/middlewares"
	"pledge-backend/config"

	"github.com/gin-gonic/gin"
)

// InitRoute 初始化所有 API 路由
//
// 参数:
//   - e: Gin 引擎实例
//
// 返回:
//   - *gin.Engine: 配置好路由的 Gin 引擎
//
// 【调用时机】
// 在 pledge_api.go 的 main() 函数中调用:
//
//	routes.InitRoute(app)
func InitRoute(e *gin.Engine) *gin.Engine {

	// ============================================================
	// 创建版本化路由组
	// ============================================================
	// 所有 API 路由的前缀: /api/v{version}
	// 例如: /api/v2/poolBaseInfo
	v2Group := e.Group("/api/v" + config.Config.Env.Version)

	// ============================================================
	// 质押池相关接口 (Pool)
	// ============================================================
	// 这些接口用于查询质押池的基本信息和数据
	poolController := controllers.PoolController{}

	// GET /api/v{version}/poolBaseInfo
	// 获取质押池基础信息（池名称、币种、利率等静态配置）
	// 公开接口，无需登录
	v2Group.GET("/poolBaseInfo", poolController.PoolBaseInfo)

	// GET /api/v{version}/poolDataInfo
	// 获取质押池动态数据（TVL、借贷量、用户数等实时数据）
	// 公开接口，无需登录
	v2Group.GET("/poolDataInfo", poolController.PoolDataInfo)

	// GET /api/v{version}/token
	// 获取支持的代币列表（代币地址、符号、精度等）
	// 公开接口，无需登录
	v2Group.GET("/token", poolController.TokenList)

	// POST /api/v{version}/pool/debtTokenList
	// 获取债务代币列表
	// 需要管理员 Token 验证
	v2Group.POST("/pool/debtTokenList", middlewares.CheckToken(), poolController.DebtTokenList)

	// POST /api/v{version}/pool/search
	// 搜索/筛选质押池
	// 需要管理员 Token 验证
	v2Group.POST("/pool/search", middlewares.CheckToken(), poolController.Search)

	// ============================================================
	// 价格推送接口 (Price) - WebSocket
	// ============================================================
	// 用于向前端实时推送 PLGR/USDT 价格
	priceController := controllers.PriceController{}

	// GET /api/v{version}/price
	// WebSocket 升级端点
	// 客户端连接后会自动接收价格推送
	// 连接示例: ws://localhost:8081/api/v2/price
	// 公开接口，无需登录
	v2Group.GET("/price", priceController.NewPrice)

	// ============================================================
	// 多签管理接口 (MultiSign) - 管理员专用
	// ============================================================
	// 用于配置和查询多签钱包设置
	multiSignPoolController := controllers.MultiSignPoolController{}

	// POST /api/v{version}/pool/setMultiSign
	// 设置/更新多签配置
	// 需要管理员 Token 验证
	v2Group.POST("/pool/setMultiSign", middlewares.CheckToken(), multiSignPoolController.SetMultiSign)

	// POST /api/v{version}/pool/getMultiSign
	// 获取当前多签配置
	// 需要管理员 Token 验证
	v2Group.POST("/pool/getMultiSign", middlewares.CheckToken(), multiSignPoolController.GetMultiSign)

	// ============================================================
	// 用户认证接口 (User)
	// ============================================================
	userController := controllers.UserController{}

	// POST /api/v{version}/user/login
	// 管理员登录
	// 验证用户名密码，返回 JWT Token
	// 公开接口
	v2Group.POST("/user/login", userController.Login)

	// POST /api/v{version}/user/logout
	// 管理员登出
	// 清除 Redis 中的登录状态
	// 需要 Token 验证
	v2Group.POST("/user/logout", middlewares.CheckToken(), userController.Logout)

	return e
}

/*
 * ==================================================================================
 * API 接口汇总表
 * ==================================================================================
 *
 * | 方法   | 路径                          | 说明                 | 认证要求 |
 * |--------|-------------------------------|----------------------|----------|
 * | GET    | /api/v{ver}/poolBaseInfo      | 质押池基础信息       | 无       |
 * | GET    | /api/v{ver}/poolDataInfo      | 质押池动态数据       | 无       |
 * | GET    | /api/v{ver}/token             | 代币列表             | 无       |
 * | POST   | /api/v{ver}/pool/debtTokenList| 债务代币列表         | 需要     |
 * | POST   | /api/v{ver}/pool/search       | 搜索质押池           | 需要     |
 * | GET    | /api/v{ver}/price             | WebSocket 价格推送   | 无       |
 * | POST   | /api/v{ver}/pool/setMultiSign | 设置多签配置         | 需要     |
 * | POST   | /api/v{ver}/pool/getMultiSign | 获取多签配置         | 需要     |
 * | POST   | /api/v{ver}/user/login        | 管理员登录           | 无       |
 * | POST   | /api/v{ver}/user/logout       | 管理员登出           | 需要     |
 *
 * ==================================================================================
 */
