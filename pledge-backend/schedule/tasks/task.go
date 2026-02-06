/*
 * ==================================================================================
 * task.go - 定时任务调度器
 * ==================================================================================
 *
 * 【核心功能】
 * 该文件负责编排和调度所有后台定时任务，包括：
 * - 同步借贷池数据 (每 2 分钟)
 * - 更新代币价格 (每 1 分钟)
 * - 更新代币符号 (每 2 小时)
 * - 更新代币 Logo (每 2 小时)
 * - 监控账户余额 (每 30 分钟)
 * - 写入 PLGR 价格到链上 (每 30 分钟)
 *
 * 【技术实现】
 * 使用 gocron 库实现任务调度，所有任务在 UTC 时区运行
 *
 * 【调用关系】
 * pledge_task.go (入口) --> Task() --> 各个 Service
 * ==================================================================================
 */

package tasks

import (
	"pledge-backend/db"
	"pledge-backend/schedule/common"
	"pledge-backend/schedule/services"
	"time"

	"github.com/jasonlvhit/gocron"
)

// Task - 定时任务主函数
// 【入口函数】由 pledge_task.go 的 main() 调用
//
// 执行流程:
//  1. 加载环境变量
//  2. 清空 Redis 缓存
//  3. 立即执行一次所有任务 (初始化)
//  4. 配置定时任务调度
//  5. 启动调度器 (阻塞运行)
func Task() {

	// ============================================================
	// Step 1: 加载环境变量
	// 从系统环境变量读取配置 (如私钥等敏感信息)
	// ============================================================
	common.GetEnv()

	// ============================================================
	// Step 2: 清空 Redis 缓存
	// 确保服务重启后从链上重新同步所有数据
	// ============================================================
	err := db.RedisFlushDB()
	if err != nil {
		panic("clear redis error " + err.Error())
	}

	// ============================================================
	// Step 3: 初始化 - 立即执行一次所有任务
	// 这确保服务启动后立即有可用数据，而不是等待定时器触发
	// ============================================================

	// 同步所有借贷池信息 (从链上读取 PoolBaseInfo 和 PoolDataInfo)
	services.NewPool().UpdateAllPoolInfo()

	// 更新所有代币价格 (从链上 Oracle 读取)
	services.NewTokenPrice().UpdateContractPrice()

	// 更新代币符号 (从代币合约读取 symbol())
	services.NewTokenSymbol().UpdateContractSymbol()

	// 更新代币 Logo (从预配置的 URL 获取)
	services.NewTokenLogo().UpdateTokenLogo()

	// 监控账户余额 (检查合约地址的 BNB 余额)
	services.NewBalanceMonitor().Monitor()

	// 写入 PLGR 价格到链上 Oracle (主网已禁用)
	// services.NewTokenPrice().SavePlgrPrice()
	// 测试网: 写入固定测试价格
	services.NewTokenPrice().SavePlgrPriceTestNet()

	// ============================================================
	// Step 4: 配置定时任务调度
	// 使用 gocron 库，所有任务在 UTC 时区运行
	// ============================================================
	s := gocron.NewScheduler()
	s.ChangeLoc(time.UTC) // 设置时区为 UTC

	// 每 2 分钟: 同步借贷池信息
	// 从链上读取所有池子的最新状态
	_ = s.Every(2).Minutes().From(gocron.NextTick()).Do(services.NewPool().UpdateAllPoolInfo)

	// 每 1 分钟: 更新代币价格
	// 从链上 Oracle 读取代币价格并保存到数据库
	_ = s.Every(1).Minute().From(gocron.NextTick()).Do(services.NewTokenPrice().UpdateContractPrice)

	// 每 2 小时: 更新代币符号
	// 代币符号变化较少，低频更新即可
	_ = s.Every(2).Hours().From(gocron.NextTick()).Do(services.NewTokenSymbol().UpdateContractSymbol)

	// 每 2 小时: 更新代币 Logo
	_ = s.Every(2).Hours().From(gocron.NextTick()).Do(services.NewTokenLogo().UpdateTokenLogo)

	// 每 30 分钟: 监控账户余额
	// 如果余额低于阈值，发送告警邮件
	_ = s.Every(30).Minutes().From(gocron.NextTick()).Do(services.NewBalanceMonitor().Monitor)

	// 每 30 分钟: 写入 PLGR 价格到链上 (主网已禁用)
	// _ = s.Every(30).Minutes().From(gocron.NextTick()).Do(services.NewTokenPrice().SavePlgrPrice)

	// 每 30 分钟: 写入 PLGR 价格到测试网
	_ = s.Every(30).Minutes().From(gocron.NextTick()).Do(services.NewTokenPrice().SavePlgrPriceTestNet)

	// ============================================================
	// Step 5: 启动调度器
	// <-s.Start() 会阻塞当前 goroutine，直到调度器停止
	// ============================================================
	<-s.Start()
}
