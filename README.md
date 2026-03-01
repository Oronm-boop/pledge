

## :one:  系统概述
借贷是Defi领域非常重要的模块，Maker、Aave、Compound是当前借贷领域的三巨头。  
Maker: 抵押资产获取稳定币DAI  [详情](https://docs.makerdao.com/smart-contract-modules/dai-module)  
Aave: 加密货币借贷协议  [详情](https://aave.com/docs/developers/smart-contracts)  
Compound: 加密货币借贷协议  [详情](https://docs.compound.finance/#protocol-contracts)  
Pledge 是一个去中心化金融（DeFi）项目，旨在提供固定利率的借贷协议，主要服务于加密资产持有者。Pledge 旨在解决 DeFi 借贷市场中缺乏固定利率和固定期限融资产品的问题。传统的 DeFi 借贷协议通常采用可变利率，主要服务于短期交易者，而 Pledge 则专注于长期融资需求。以下是对 Pledge 项目的详细分析：

## :two:  功能需求
### 2.1 核心功能
- **固定利率借贷**: Pledge 提供固定利率的借贷服务，减少利率波动带来的风险。
- **去中心化 Dex 交易**(核心)。

### 2.2 主要角色
- **借款人**: 可以抵押加密资产以获得稳定币，用于投资非加密资产。
- **贷款人**: 提供流动性，获得固定回报。

### 2.3 关键组件
- **智能合约**: 自动执行借贷协议，确保交易记录上链且不可篡改。
- **pToken/jToken**: 代表未来时间点的价值转移，用于借贷和清算。

## :three:  代码分析
PledgePool.sol 是 Pledge 项目的核心智能合约之一，主要功能包括：
### 3.1 Pool
- **创建和管理借贷池**: 包括设置借贷池的基本信息、状态管理等。
- **用户存款和取款**: 处理用户的借款和贷款操作，包括存款、取款、索赔等。
- **自动清算**: 根据设定的阈值自动触发清算操作，保护借贷双方的利益。
- **费用管理**: 设置和管理借贷费用，确保平台的可持续运营。

  ![whiteboard_exported_image](https://github.com/user-attachments/assets/db77416d-9a71-46b8-84dd-eb5a72fcdf90)  


## :four:  事件和函数
- **事件**:如 DepositLend、RefundLend、ClaimLend 等，用于记录用户操作。
- **函数**: 如 DepositLend、refundLend、claimLend 等，实现具体的业务逻辑。

## :five: 常见问题与概念解析 (FAQ)

### 5.1 概念类比 (Java vs Go)
为了方便 Java 开发者理解，我们可以这样类比后端的代码结构：

- **Request Struct** ≈ **DTO (Data Transfer Object)**
  - 作用：接收前端传入的参数，不包含业务逻辑。
- **Response Struct** ≈ **VO (View Object)**
  - 作用：向前端展示数据，通常对数据库实体进行裁剪或格式化。

### 5.2 为什么既有 BNB 又有 KuCoin？
它们在项目中扮演完全不同的角色：

- **BNB (BSC Chain)**: **房东 (地基)**
  - 作用：**基础设施**。智能合约部署在这里，资金存储在这里。
  - 缺了它：系统无法运行。
- **KuCoin**: **报价员 (数据源)**
  - 作用：**外部预言机数据源**。后端从这里查询 `PLGR` 代币的市场价格，并写入链上。
  - 缺了它：系统可以运行，但无法获知平台币的最新市场价值。

### 5.3 配置文件中的关键地址
- **`plgr_address`**: **平台币合约地址**。
  - 用途：后端用于查询平台币价格或计算奖励。在测试网部署脚本中如果没有专门部署 PLGR，该字段通常指向一个占位用的代币地址 (如 spBUSD) 或旧地址。
- **`pledge_pool_token`**: **PledgePool 主合约地址**。
  - 用途：借贷业务的核心入口。
- **`bsc_pledge_oracle_token`**: **预言机合约地址**。
  - 用途：管理及查询代币价格。

