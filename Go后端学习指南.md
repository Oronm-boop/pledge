# Go 后端详细学习指南

> 本指南旨在帮助你从零开始掌握 `pledge-backend` 项目。后端的核心指责是 **"链上数据同步"** 和 **"API 数据服务"**。

---

## 📚 第一阶段：数据库架构 (基石)

后端的所有业务逻辑都围绕着数据库表展开。理解了表结构，就理解了 80% 的业务。

### 1. 核心表：`poolbases` (池子基础信息)
这张表存储了借贷池的 **静态配置信息**。一旦池子创建，这些信息很少变动。

| 字段名 | 类型 | 含义详解 |
|--------|------|----------|
| `id` | int | 数据库自增 ID (内部使用) |
| `pool_id` | int | **链上 Pool ID** (对应合约里的 `_pid`)，这是跟合约交互的关键 |
| `lend_token` | varchar | 出借代币合约地址 (如 USDT 地址) |
| `borrow_token` | varchar | 借入/抵押代币合约地址 (如 BTC 地址) |
| `lend_token_symbol` | varchar | 出借代币符号 (如 "USDT") |
| `borrow_token_symbol` | varchar | 借入代币符号 (如 "BTC") |
| `settle_time` | varchar | **结算时间戳** (在这个时间点，计算利率并锁定) |
| `end_time` | varchar | **到期时间戳** (池子结束，资金释放) |
| `interest_rate` | varchar | 年化利率 (通常是放大 1e8 或类似精度的整数) |
| `max_supply` | varchar | 最大募集上限 |
| `lend_supply` | varchar | 当前出借总额 (募集到了多少) |
| `borrow_supply` | varchar | 当前借入总额 (抵押了多少) |
| `state` | varchar | 池子状态 (0:匹配, 1:执行, 2:完成, 3:清算, 4:失败) |
| `sp_coin` | varchar | SP Token 地址 (出借凭证) |
| `jp_coin` | varchar | JP Token 地址 (借款凭证) |
| `auto_liquidate_threshold` | varchar | 自动清算阈值 |
| `chain_id` | varchar | 链 ID (如 56=BSC Mainnet, 97=BSC Testnet) |

### 2. 核心表：`pooldata` (池子动态数据)
这张表存储了池子在 **结算后** 的动态数据，主要用于计算收益和清算状态。

| 字段名 | 类型 | 含义详解 |
|--------|------|----------|
| `pool_id` | varchar | 对应 `poolbases` 的 pool_id |
| `settle_amount_lend` | varchar | **实际结算的出借金额** (可能小于募集总额) |
| `settle_amount_borrow` | varchar | **实际结算的借入金额** |
| `finish_amount_lend` | varchar | 结束时出借方应得总额 (本金+利息) |
| `finish_amount_borrow` | varchar | 结束时借款方应还总额 |
| `liquidation_amoun_lend` | varchar | 清算时的出借方金额 |
| `updated_at` | datetime | 最后更新时间 |

### 3. 辅助表：`token_info` (代币信息)
用于存储代币的元数据，避免每次都去链上查。

| 字段名 | 类型 | 含义详解 |
|--------|------|----------|
| `token` | varchar | 代币合约地址 (主键概念) |
| `symbol` | varchar | 代币符号 (BTC, ETH) |
| `decimals` | int | 代币精度 (如 USDT是6, DAI是18) |
| `price` | varchar | **当前预言机价格** (后端定时任务更新) |
| `logo` | varchar | 代币图标 URL |

---

## 🏗️ 第二阶段：代码结构映射

理解了数据，现在看代码分别放在哪里。

### 1. 模型层 (`api/models`)
Go 语言中的结构体 (Struct)，对应上面的数据库表。
- `api/models/pool.go` → 对应 `poolbases` 和 `pooldata` 表的操作。
- `api/models/token.go` → 对应 `token_info` 表的操作。

### 2. 定时任务层 (`schedule/`) **[核心引擎]**
这是后端最繁忙的部分，负责不停地把链上数据搬运到数据库。
- `schedule/tasks/task.go`: **总调度器**，定义了哪些任务在跑 (如每10秒跑一次)。
- `schedule/services/poolService.go`: **池子同步逻辑**。
  - 函数 `UpdateAllPoolInfo()`: 循环遍历所有池子，调用合约获取最新状态。
  - 重点逻辑: 它会计算数据哈希 (MD5)，如果链上数据没变，就不写数据库，节省性能。
- `schedule/services/tokenPriceService.go`: **价格同步逻辑**。
  - 定时从 Oracle 合约或交易所 API 获取价格，更新 `token_info` 表。

### 3. 接口层 (`api/`) **[服务窗口]**
给前端提供数据。
- `api/routes/route.go`: **路由表**，定义了 URL (如 `/api/pool/list`) 对应哪个控制器。
- `api/controllers/poolController.go`: **控制器**，接收请求 -> 查数据库 -> 返回 JSON。
  - 函数 `GetPoolList()`: 前端首页列表就是调用的它。

---

## 🚀 第三阶段：核心业务流程解析

### 场景一：后端是如何发现新池子的？
1. **触发**: `schedule/tasks/task.go` 中的定时任务触发。
2. **查询长度**: 调用 `PledgePool` 合约的 `poolLength()` 方法，知道现在有多少个池子 (比如 100 个)。
3. **遍历同步**: `poolService` 里的循环从 ID 0 遍历到 99。
4. **获取详情**: 对每个 ID，调用合约 `getPoolBaseInfo(id)`。
5. **入库**: 将获取到的 `Struct` 数据写入 `poolbases` 表。

### 场景二：前端如何获取页面数据？
1. **请求**: 前端发起 `GET /api/pool/list`。
2. **路由**: `route.go` 将请求分发给 `poolController.GetPoolList`。
3. **查询**: Controller 调用 `models.GetPools()` 从 MySQL 查询数据。
4. **关联**: 可能会关联 `token_info` 表拿到代币图标和当前价格。
5. **计算**: 根据 `settle_time` 和当前时间，计算出是一个 "待开始"、"进行中" 还是 "已结束" 的状态。
6. **响应**: 返回 JSON 数据给前端渲染。

---

## 💡 学习建议与实操

1. **先看 Model**: 打开 `api/models/pool.go`，看看 Go 结构体是怎么把 SQL 字段映射起来的 (GORM 标签)。
2. **再看 Service**: 打开 `schedule/services/poolService.go`，重点看 `UpdateAllPoolInfo` 函数。试着跟着代码走一遍 "从链上读数据 -> 存入数据库" 的流程。
3. **最后看 Controller**: 打开 `api/controllers/poolController.go`，看数据是怎么被取出来发给前端的。

### 常用调试技巧
- 在 `schedule/services/poolService.go` 里加 `fmt.Println("正在更新池子:", pid)`，然后运行后端，直观感受同步过程。
- 查看数据库 `poolbases` 表，观察 `state` 字段随着时间的变化。
