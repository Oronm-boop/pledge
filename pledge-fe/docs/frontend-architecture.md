# Pledge 前端架构

## 整体架构图

```mermaid
flowchart TB
    subgraph Entry["📦 入口层"]
        Index["index.tsx<br/>应用入口"]
        Routes["routes.tsx<br/>路由配置"]
        Index --> Routes
    end

    subgraph Pages["📄 页面层 (pages/Dapp/)"]
        Home["Home/<br/>首页"]
        Market_Pool["Market_Pool/<br/>借贷池市场"]
        Market_Mode["Market_Mode/<br/>借贷模式"]
        Dex["Dex/<br/>交易所"]
    end

    subgraph Components["🧩 组件层"]
        Layout["Layout/<br/>页面布局"]
        UI["components/<br/>可复用 UI 组件"]
    end

    subgraph Web3["🔗 Web3 层"]
        Contracts["contracts/<br/>合约类型定义"]
        ABIs["abis/<br/>合约 ABI"]
        Connectors["connectors/<br/>钱包连接器"]
        Hooks["hooks/<br/>Web3 Hooks"]
    end

    subgraph Services["🌐 服务层"]
        PoolServer["PoolServer.ts<br/>借贷池 API"]
        ERC20Server["ERC20Server.ts<br/>代币 API"]
        userServer["userServer.ts<br/>用户 API"]
        BscOracle["BscPledgeOracle.ts<br/>价格 API"]
        web3Service["web3.ts<br/>Web3 Provider"]
    end

    subgraph State["📊 状态管理层"]
        Redux["state/ (Redux)"]
        MobX["stores/ (MobX)"]
    end

    subgraph Config["⚙️ 配置层"]
        Constants["constants/<br/>合约地址、网络配置"]
        Theme["theme/<br/>主题样式"]
        Utils["utils/<br/>工具函数"]
    end

    subgraph External["🌍 外部系统"]
        Wallet["MetaMask / WalletConnect"]
        Blockchain["BSC 区块链"]
        Backend["Pledge 后端 API"]
    end

    Routes --> Pages
    Pages --> Components
    Pages --> Hooks
    Pages --> Services
    Pages --> State

    Hooks --> Contracts
    Hooks --> ABIs
    Hooks --> Connectors

    Services --> Backend
    Connectors --> Wallet
    Hooks --> Blockchain
```

---

## 目录结构详解

```
src/
├── index.tsx              # 应用入口，挂载 React App
├── routes.tsx             # 顶层路由配置
│
├── pages/                 # 页面组件
│   └── Dapp/              # DApp 主页面
│       ├── Home/          # 首页
│       ├── Market_Pool/   # 借贷池市场
│       ├── Market_Mode/   # 借贷模式选择
│       ├── Dex/           # 交易所功能
│       └── routes.tsx     # DApp 内部路由
│
├── components/            # 可复用 UI 组件 (108个)
├── Layout/                # 页面布局组件 (Header, Footer, Sidebar)
│
├── contracts/             # 智能合约 TypeScript 类型
│   ├── PledgePool.ts      # 质押池合约
│   ├── ERC20.ts           # ERC20 代币
│   ├── BscPledgeOracle.ts # 价格预言机
│   ├── DebtToken.ts       # 债务代币
│   └── ...
│
├── abis/                  # 合约 ABI 文件 (10个)
│
├── hooks/                 # 自定义 React Hooks (29个)
│   ├── useContract.ts     # 获取合约实例
│   ├── useAuth.ts         # 钱包认证
│   ├── useApproveCallback.ts  # 代币授权
│   ├── useCurrencyBalance.ts  # 余额查询
│   ├── useSwapCallback.ts     # 交易回调
│   └── ...
│
├── services/              # API 服务层 (8个)
│   ├── PoolServer.ts      # 借贷池后端 API
│   ├── ERC20Server.ts     # 代币服务
│   ├── BscPledgeOracle.ts # 预言机服务
│   ├── web3.ts            # Web3 Provider
│   └── ...
│
├── state/                 # Redux 状态管理 (44个文件)
├── stores/                # MobX 状态管理
│
├── connectors/            # 钱包连接器
│   └── (MetaMask, WalletConnect 配置)
│
├── constants/             # 常量配置 (19个)
│   ├── 合约地址
│   ├── 网络配置
│   └── 代币列表
│
├── utils/                 # 工具函数 (21个)
├── theme/                 # 主题样式
└── assets/                # 静态资源
```

---

## 核心模块关系

```mermaid
flowchart LR
    subgraph User["👤 用户操作"]
        Click["点击按钮"]
        Connect["连接钱包"]
    end

    subgraph Page["📄 页面"]
        MarketPool["借贷池页面"]
    end

    subgraph Hooks["🪝 Hooks"]
        useContract["useContract()"]
        useAuth["useAuth()"]
        useApprove["useApproveCallback()"]
    end

    subgraph Services["🌐 Services"]
        PoolServer["PoolServer"]
        web3["web3.ts"]
    end

    subgraph External["🌍 外部"]
        MetaMask["MetaMask"]
        BSC["BSC 链"]
        API["后端 API"]
    end

    Click --> MarketPool
    Connect --> useAuth
    MarketPool --> useContract
    MarketPool --> PoolServer
    
    useAuth --> MetaMask
    useContract --> web3
    web3 --> BSC
    PoolServer --> API
    useApprove --> BSC
```

---

## 数据流向

```mermaid
sequenceDiagram
    participant User as 👤 用户
    participant Page as 📄 页面
    participant Hook as 🪝 Hook
    participant Service as 🌐 Service
    participant Backend as 🖥️ 后端
    participant Chain as ⛓️ 区块链

    User->>Page: 访问借贷池
    Page->>Service: 请求池信息
    Service->>Backend: GET /api/v2/poolBaseInfo
    Backend-->>Service: 返回数据
    Service-->>Page: 渲染列表

    User->>Page: 点击"质押"
    Page->>Hook: useContract()
    Hook->>Chain: 调用 PledgePool.deposit()
    Chain-->>Hook: 返回交易结果
    Hook-->>Page: 更新 UI
```

---

## 关键 Hooks 说明

| Hook | 文件 | 功能 |
|------|------|------|
| `useContract` | hooks/useContract.ts | 获取智能合约实例 |
| `useAuth` | hooks/useAuth.ts | 钱包连接/断开 |
| `useApproveCallback` | hooks/useApproveCallback.ts | 代币授权操作 |
| `useCurrencyBalance` | hooks/useCurrencyBalance.ts | 查询代币余额 |
| `useSwapCallback` | hooks/useSwapCallback.ts | 代币交换 |

---

## 关键 Services 说明

| Service | 文件 | 功能 |
|---------|------|------|
| `PoolServer` | services/PoolServer.ts | 借贷池 CRUD 操作 |
| `ERC20Server` | services/ERC20Server.ts | 代币信息查询 |
| `web3` | services/web3.ts | Web3 Provider 管理 |
| `BscPledgeOracle` | services/BscPledgeOracle.ts | 价格预言机交互 |

---

## 学习路径建议

```mermaid
flowchart LR
    A["1️⃣ index.tsx<br/>了解入口"] --> B["2️⃣ routes.tsx<br/>了解路由"]
    B --> C["3️⃣ pages/Dapp/<br/>浏览页面"]
    C --> D["4️⃣ hooks/<br/>学习 Web3 交互"]
    D --> E["5️⃣ services/<br/>学习 API 调用"]
    E --> F["6️⃣ contracts/<br/>理解合约类型"]
```
