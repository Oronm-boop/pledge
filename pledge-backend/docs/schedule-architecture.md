# Schedule 模块架构

## 概述

`schedule` 模块是 Pledge 后端的**定时任务服务**，与 `pledge_api.go` 分开独立运行。
负责定期从区块链同步数据到数据库，以及将价格数据写入链上 Oracle。

---

## 整体架构图

```mermaid
flowchart TB
    subgraph Entry["📦 入口层"]
        Main["pledge_task.go<br/>main()"]
        Task["tasks/task.go<br/>Task()"]
        Main --> Task
    end

    subgraph Scheduler["⏰ 调度层 (gocron)"]
        direction LR
        S1["每 1 分钟"]
        S2["每 2 分钟"]
        S3["每 30 分钟"]
        S4["每 2 小时"]
    end

    subgraph Services["🔧 服务层"]
        TokenPrice["tokenPriceService.go<br/>代币价格同步"]
        Pool["poolService.go<br/>借贷池同步"]
        Balance["balanceMonitor.go<br/>余额监控"]
        Symbol["tokenSymbolService.go<br/>代币符号"]
        Logo["tokenLogoService.go<br/>代币Logo"]
    end

    subgraph External["🌐 外部系统"]
        Oracle["BscPledgeOracle<br/>(链上合约)"]
        PledgePool["PledgePool<br/>(链上合约)"]
        ERC20["ERC20 代币<br/>(链上合约)"]
    end

    subgraph Storage["💾 数据存储"]
        MySQL[("MySQL")]
        Redis[("Redis")]
    end

    subgraph Common["📁 公共模块"]
        Models["models/<br/>数据模型"]
        CommonPkg["common/<br/>私钥等配置"]
    end

    Task --> Scheduler
    
    S1 --> TokenPrice
    S2 --> Pool
    S3 --> Balance
    S3 --> TokenPrice
    S4 --> Symbol
    S4 --> Logo

    TokenPrice <-->|"读/写价格"| Oracle
    Pool <-->|"读取池信息"| PledgePool
    Symbol -->|"读取 symbol()"| ERC20
    Balance -->|"读取余额"| ERC20

    TokenPrice --> MySQL
    TokenPrice --> Redis
    Pool --> MySQL
    Pool --> Redis
    Symbol --> MySQL
    Logo --> MySQL

    Services --> Models
    Services --> CommonPkg
```

---

## 目录结构

```
schedule/
├── pledge_task.go          # 入口文件，初始化并启动任务
├── README.md               # 使用说明
├── pledge-task.service     # Linux systemd 服务配置
│
├── tasks/
│   └── task.go             # 任务调度器，定义所有定时任务
│
├── services/               # 核心业务逻辑
│   ├── tokenPriceService.go    # ⭐ 代币价格同步（含链上写操作）
│   ├── poolService.go          # 借贷池信息同步
│   ├── tokenSymbolService.go   # 代币符号同步
│   ├── tokenLogoService.go     # 代币Logo同步
│   └── balanceMonitor.go       # 余额监控告警
│
├── models/                 # 数据模型
│   └── ...                 # TokenInfo, PoolInfo 等
│
└── common/                 # 公共配置
    └── ...                 # Admin 私钥等
```

---

## 定时任务清单

```mermaid
gantt
    title 定时任务执行频率
    dateFormat X
    axisFormat %s

    section 高频任务
    UpdateContractPrice (读取价格)    :active, 0, 60
    UpdateAllPoolInfo (同步池信息)   :active, 0, 120

    section 中频任务
    Monitor (余额监控)               :active, 0, 1800
    SavePlgrPrice (写入价格)         :active, 0, 1800

    section 低频任务
    UpdateContractSymbol (代币符号)  :active, 0, 7200
    UpdateTokenLogo (代币Logo)       :active, 0, 7200
```

| 任务 | 频率 | 服务 | 功能 |
|------|------|------|------|
| `UpdateContractPrice()` | 每 1 分钟 | tokenPriceService | 从 Oracle 读取代币价格 |
| `UpdateAllPoolInfo()` | 每 2 分钟 | poolService | 从 PledgePool 读取借贷池数据 |
| `Monitor()` | 每 30 分钟 | balanceMonitor | 监控账户余额，低于阈值发邮件 |
| `SavePlgrPriceTestNet()` | 每 30 分钟 | tokenPriceService | ⭐ 写入 PLGR 价格到 Oracle |
| `UpdateContractSymbol()` | 每 2 小时 | tokenSymbolService | 读取代币 symbol() |
| `UpdateTokenLogo()` | 每 2 小时 | tokenLogoService | 获取代币 Logo URL |

---

## 数据流向

### 读取流程（链上 → 数据库）

```mermaid
sequenceDiagram
    participant Scheduler as ⏰ 调度器
    participant Service as 🔧 Service
    participant RPC as 🌐 区块链 RPC
    participant Contract as 📜 智能合约
    participant Redis as 💾 Redis
    participant MySQL as 💾 MySQL

    Scheduler->>Service: 触发定时任务
    Service->>RPC: 建立连接
    RPC->>Contract: 调用 getPrice() / getPoolInfo()
    Contract-->>RPC: 返回数据
    RPC-->>Service: 解析数据
    Service->>Redis: 检查是否有变化
    alt 数据有变化
        Service->>Redis: 更新缓存
        Service->>MySQL: 更新数据库
    end
```

### 写入流程（数据库 → 链上）

```mermaid
sequenceDiagram
    participant Scheduler as ⏰ 调度器
    participant Service as 🔧 tokenPriceService
    participant Redis as 💾 Redis
    participant Crypto as 🔐 加密模块
    participant RPC as 🌐 区块链 RPC
    participant Oracle as 📜 Oracle 合约

    Scheduler->>Service: 触发 SavePlgrPrice()
    Service->>Redis: 读取 plgr_price
    Service->>Crypto: 加载 Admin 私钥
    Crypto-->>Service: 返回私钥
    Service->>Service: 构造交易 & 签名
    Service->>RPC: 发送交易
    RPC->>Oracle: 调用 setPrice(token, price)
    Oracle-->>RPC: 交易确认
    RPC-->>Service: 返回 TxHash
```

---

## 与 API 服务的关系

```mermaid
flowchart LR
    subgraph API["pledge_api.go"]
        direction TB
        A1["HTTP API"]
        A2["WebSocket 价格推送"]
        A3["kucoin.go 价格监听"]
    end

    subgraph Schedule["pledge_task.go"]
        direction TB
        S1["定时任务调度"]
        S2["链上数据同步"]
        S3["链上价格写入"]
    end

    subgraph Shared["共享资源"]
        Redis[("Redis")]
        MySQL[("MySQL")]
        Contracts["智能合约"]
    end

    A3 -->|"写入"| Redis
    S2 -->|"读取"| Redis
    S3 -->|"读取"| Redis

    A1 -->|"查询"| MySQL
    S2 -->|"写入"| MySQL

    S2 <-->|"读取"| Contracts
    S3 -->|"写入"| Contracts
```

**关键点**：
- API 服务的 `kucoin.go` 将 KuCoin 价格写入 Redis
- Schedule 服务的 `SavePlgrPrice()` 从 Redis 读取价格，写入链上 Oracle
- 两个服务通过 **Redis** 和 **MySQL** 共享数据

---

## 启动方式

```bash
# 开发环境
go run schedule/pledge_task.go

# 生产环境 (Linux systemd)
sudo systemctl start pledge-task.service
```
