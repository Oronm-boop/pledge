# Go 后端 Windows 本地运行指南

> 本文档将指导你在 Windows 环境下从零开始搭建并运行 `pledge-backend` 服务。

---

## 🛠️ 前置准备 (Environment)

在运行代码之前，你需要确保本地已经安装并运行了以下基础服务。

### 1. 安装基础软件
- **Go 语言环境**: 推荐 Go 1.16+
  - 下载: [https://go.dev/dl/](https://go.dev/dl/)
  - 验证: `go version`
- **Git**:用于拉取代码 (已有)
- **MinGW / TDM-GCC**: (可选) Windows 下如果编译涉及 CGO 可能需要，纯 Go 项目一般不需要。

### 2. 准备中间件 (必须)
后端强依赖 **MySQL** 和 **Redis**，请确保本地已安装并启动。

#### MySQL (数据库)
- **版本**: 5.7 或 8.0 均可
- **本地服务地址**: `127.0.0.1:3306`
- **默认账号**: `root` / `123456` (需与配置文件一致)
- **初始化数据**:
  1. 创建数据库 `pledge_v21`
  2. 导入 SQL 文件: `pledge-backend/db/pledge.sql`
  ```bash
  # 命令行导入示例
  mysql -u root -p pledge_v21 < db/pledge.sql
  ```

#### Redis (缓存)
- **版本**: 任意稳定版
- **本地服务地址**: `127.0.0.1:6379`
- **密码**: `123456` (注意：默认 Redis 无密码，需要修改 `redis.conf` 或修改项目配置)

---

## ⚙️ 修改配置文件 (Config)

项目配置文件位于 `pledge-backend/config/configV21.toml`。

你需要根据本地环境修改以下关键项：

```toml
[mysql]
address = "localhost"   # 数据库地址
port = "3306"
db_name = "pledge_v21"  # 数据库名
user_name = "root"      # 数据库用户名
password = "123456"     # 数据库密码 (请修改为你本地的密码)

[redis]
address = "localhost"
port = "6379"
password = "123456"     # Redis 密码 (如果你本地没密码，这就留空 "")
```

---

## 🚀 启动步骤 (Run)

### 方法一：直接源码运行 (推荐开发调试)

1. **打开终端** (PowerShell 或 CMD)，进入项目根目录：
   ```powershell
   cd e:\1pledge\ProjectBreakdown-Pledge-main\pledge-backend
   ```

2. **下载依赖**:
   ```bash
   go mod tidy
   go mod download
   ```

3. **运行 Api 服务**:
   ```bash
   go run api/pledge_api.go
   ```
   *成功标志*: 看到类似 `[GIN-debug] Listening and serving HTTP on :8080` 的日志。

### 方法二：编译为 exe 运行 (推荐稳定运行)

1. **编译**:
   ```bash
   go build -o pledge-server.exe api/pledge_api.go
   ```

2. **运行**:
   ```powershell
   .\pledge-server.exe
   ```

---

## 🔍 验证运行 (Verify)

服务启动后，可以通过浏览器或 Postman 访问以下接口来验证：

- **基础健康检查**: `http://localhost:8080/` (如果配置了根路由)
- **获取池子列表**: `http://localhost:8080/api/pool/list` (GET)

如果能返回 JSON 数据，说明：
1. Web 服务启动成功
2. 数据库连接正常 (因为查列表需要读库)

---

## ⚠️ 常见问题 (Troubleshooting)

### Q1: 连接数据库失败 (Connection refused)
- **检查**: MySQL 服务是否启动？任务管理器 -> 服务 -> MySQL
- **检查**: 用户名密码是否正确？尝试用 Navicat 或 DBeaver 连接试试。

### Q2: 缺包 (missing go.sum entry)
- **解决**: 执行 `go mod tidy` 重新整理依赖。

### Q3: 端口被占用
- **解决**: 修改 `configV21.toml` 中的 `[env] port = "8080"` 为其他端口，如 `8081`。
