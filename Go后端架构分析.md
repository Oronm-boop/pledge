# Go 后端业务支持分析 (Go Backend Analysis)

> 本文档详细分析 `pledge-backend` 的 Go 代码架构，说明其如何与智能合约交互以及如何为前端提供数据支持。

---

## 系统架构总览 (System Architecture Overview)

`pledge-backend` 由两个独立运行的 Go 服务组成:

```mermaid
graph TD
    subgraph "Pledge Backend System"
        API["pledge_api.go<br/>(Web API Service)"]
        TASK["pledge_task.go<br/>(Scheduled Task Service)"]
    end

    subgraph "External Systems"
        BC["BSC / Blockchain"]
        KC["KuCoin Exchange"]
    end

    subgraph "Data Stores"
        MYSQL[(MySQL)]
        REDIS[(Redis)]
    end

    TASK -- "定时读取链上状态" --> BC
    TASK -- "获取PLGR价格" --> KC
    TASK -- "同步数据" --> MYSQL
    TASK -- "缓存数据" --> REDIS

    API -- "查询池子信息" --> MYSQL
    API -- "读取缓存" --> REDIS
    API -- "提供REST API" --> FE["Frontend"]

    style API fill:#9cf,stroke:#333
    style TASK fill:#f9c,stroke:#333
```

---

## 模块一: 定时任务 (`schedule` Module)

### 入口与定时调度

| 文件 | 功能 |
|------|------|
| `schedule/pledge_task.go` | 入口文件，初始化数据库连接 |
| `schedule/tasks/task.go` | 任务调度器，使用 `gocron` 库 |

```mermaid
flowchart LR
    subgraph "Task() - 初始化"
        A["清空 Redis (FlushDB)"] --> B["初次执行所有任务"]
    end

    subgraph "定时任务列表"
        direction TB
        T1["每2分钟: UpdateAllPoolInfo()"]
        T2["每1分钟: UpdateContractPrice()"]
        T3["每2小时: UpdateContractSymbol()"]
        T4["每2小时: UpdateTokenLogo()"]
        T5["每30分钟: BalanceMonitor()"]
        T6["每30分钟: SavePlgrPriceTestNet()"]
    end

    B --> T1
    B --> T2
    B --> T3
    B --> T4
    B --> T5
    B --> T6
```

### 核心服务详解

#### 1. `poolService.UpdateAllPoolInfo()`

**功能**: 从链上读取所有池子的最新状态，并同步到 MySQL 和 Redis。

```mermaid
sequenceDiagram
    participant Task as PoolService
    participant Chain as BSC/PledgePool Contract
    participant DB as MySQL
    participant Cache as Redis

    Task->>Chain: 调用 PoolLength() 获取池子数量
    loop 遍历每个池子 (0 to poolLength-1)
        Task->>Chain: 调用 PoolBaseInfo(i)
        Chain-->>Task: 返回 PoolBaseInfo struct
        Task->>Chain: 调用 PoolDataInfo(i)
        Chain-->>Task: 返回 PoolDataInfo struct
        Task->>Task: 组装 PoolBase 和 PoolData 对象
        Task->>Cache: RedisGet("base_info:pool_{chainId}_{poolId}")
        alt 数据有变化 (MD5 不匹配)
            Task->>DB: SavePoolBase() (INSERT or UPDATE)
            Task->>Cache: RedisSet() 缓存新数据
        end
    end
```

> [!IMPORTANT]
> **关键点**: 后端通过调用合约的 `PoolBaseInfo` 和 `PoolDataInfo` 函数读取链上数据，这两个函数是 `PledgePool.sol` 中 `poolBaseInfo` 和 `poolDataInfo` 数组的公开 Getter。

#### 2. `tokenPriceService.UpdateContractPrice()`

**功能**: 从链上 Oracle 合约读取代币价格，并同步到 MySQL。

```mermaid
sequenceDiagram
    participant Task as TokenPriceService
    participant DB as MySQL
    participant Oracle as BscPledgeOracle Contract
    participant Cache as Redis

    Task->>DB: 查询 token_info 表获取所有 token
    loop 遍历每个 Token
        alt TestNet
            Task->>Oracle: GetPrice(tokenAddress)
            Oracle-->>Task: 返回价格 (int64)
        else MainNet
            Task->>Oracle: GetPrice(tokenAddress)
        end
        Task->>Cache: CheckPriceData() 比较缓存价格
        alt 价格有变化
            Task->>DB: SavePriceData() 更新 token_info.price
            Task->>Cache: RedisSet() 更新缓存
        end
    end
```

#### 3. `tokenPriceService.SavePlgrPrice()` (链上写操作)

**功能**: **写入** 链上 Oracle 合约，设置 PLGR 代币价格。**这是后端唯一向链上写入数据的操作。**

```mermaid
sequenceDiagram
    participant Task as TokenPriceService
    participant Cache as Redis
    participant Oracle as BscPledgeOracle Contract

    Task->>Cache: RedisGetString("plgr_price")
    Cache-->>Task: 返回从 KuCoin 获取的价格
    Task->>Task: 价格格式化 (乘以 1e8)
    Task->>Task: 加载 Admin 私钥 (PlgrAdminPrivateKey)
    Task->>Oracle: SetPrice(plgrAddress, price)
    Oracle-->>Task: 交易 Hash
```

> [!CAUTION]
> **安全风险**: Admin 私钥直接硬编码在代码中 (`schedule/common/...`)。生产环境应使用 HSM 或 Secret Manager。

#### 4. `balanceMonitor.Monitor()`

**功能**: 监控 `PledgePoolToken` 合约地址的 BNB 余额，低于阈值时发送告警邮件。

---

## 模块二: API 服务 (`api` Module)

### 入口与路由

| 文件 | 功能 |
|------|------|
| `api/pledge_api.go` | API 服务入口 |
| `api/routes/route.go` | 路由定义 |

```mermaid
graph TD
    subgraph "API Endpoints"
        A["/api/v{version}/poolBaseInfo"] --> C["PoolController.PoolBaseInfo()"]
        B["/api/v{version}/poolDataInfo"] --> D["PoolController.PoolDataInfo()"]
        E["/api/v{version}/token"] --> F["PoolController.TokenList()"]
        G["/api/v{version}/pool/search"] --> H["PoolController.Search()"]
        I["/api/v{version}/pool/debtTokenList"] --> J["PoolController.DebtTokenList()"]
        K["/api/v{version}/price"] --> L["PriceController.NewPrice()"]
        M["/api/v{version}/pool/setMultiSign"] --> N["MultiSignPoolController.SetMultiSign()"]
        O["/api/v{version}/user/login"] --> P["UserController.Login()"]
    end

    style A fill:#e8f5e9
    style B fill:#e8f5e9
    style E fill:#e8f5e9
```

### 核心 API

#### `GET /poolBaseInfo?chainId={chainId}`

**功能**: 获取指定链上所有借贷池的基本信息。

**数据来源**: `poolbases` MySQL 表 (由 `schedule` 模块同步)。

**返回示例**:
```json
{
  "pool_id": 1,
  "chain_id": "97",
  "settle_time": "1642673987",
  "end_time": "1643472720",
  "interest_rate": "10000000",
  "state": "4",
  "lend_token_info": {"lendFee": "250000", "tokenName": "BUSD"},
  "borrow_token_info": {"borrowFee": "250000", "tokenName": "DAI"},
  "sp_coin": "0x...",
  "jp_coin": "0x..."
}
```

> [!TIP]
> `state` 字段对应 `PledgePool.sol` 中的 `PoolState` 枚举:
> - 0: MATCH (匹配中) | 1: EXECUTION (执行中) | 2: FINISH (已结束) | 3: LIQUIDATION (已清算) | 4: UNDONE (未完成)

---

## 数据库设计 (Database Schema)

```mermaid
erDiagram
    poolbases {
        int id PK
        int pool_id
        string chain_id
        string settle_time
        string end_time
        string interest_rate
        string max_supply
        string lend_supply
        string borrow_supply
        string state
        string sp_coin
        string jp_coin
        json lend_token_info
        json borrow_token_info
    }

    pooldata {
        int id PK
        string pool_id
        string chain_id
        string settle_amount_lend
        string settle_amount_borrow
        string finish_amount_lend
        string finish_amount_borrow
        string liquidation_amoun_lend
        string liquidation_amoun_borrow
    }

    token_info {
        int id PK
        string symbol
        string logo
        string price
        string token
        string chain_id
        int decimals
    }

    poolbases ||--o{ pooldata : "has"
    poolbases ||--o{ token_info : "references lend/borrow token"
```

---

## 数据流总结 (Data Flow Summary)

```mermaid
flowchart TD
    subgraph "Blockchain (BSC)"
        PP["PledgePool.sol"]
        OR["BscPledgeOracle.sol"]
    end

    subgraph "Schedule Service"
        PS["poolService"]
        TS["tokenPriceService"]
        BM["balanceMonitor"]
    end

    subgraph "API Service"
        PC["PoolController"]
        PRC["PriceController"]
    end

    subgraph "Data Stores"
        MYSQL[(MySQL)]
        REDIS[(Redis)]
    end

    subgraph "External"
        FE["Frontend (React)"]
        KC["KuCoin API"]
    end

    PP -- "PoolBaseInfo/PoolDataInfo" --> PS
    OR -- "GetPrice" --> TS
    KC -- "PLGR Price" --> TS
    TS -- "SetPrice (写入链上)" --> OR

    PS --> MYSQL
    PS --> REDIS
    TS --> MYSQL
    TS --> REDIS
    BM -- "余额告警" --> EMAIL

    PC -- "查询" --> MYSQL
    PRC -- "查询" --> REDIS
    FE -- "HTTP Request" --> PC
    FE -- "HTTP Request" --> PRC

    style PP fill:#f9f
    style OR fill:#f9f
    style FE fill:#9cf
```

---

## 已完成的代码注释

以下文件已添加详细中文注释:

| 模块 | 文件 | 注释内容 |
|------|------|----------|
| Schedule | `task.go` | 任务调度流程 |
| Schedule | `poolService.go` | 链上数据同步逻辑 |
| Schedule | `tokenPriceService.go` | 价格读取 + 链上写入 |
| API | `pledge_api.go` | 服务启动流程 |
| API | `poolController.go` | API 接口说明 |
