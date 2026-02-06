/*
 * ==================================================================================
 * poolController.go - 借贷池 API 控制器
 * ==================================================================================
 *
 * 【核心功能】
 * 该控制器处理所有与借贷池相关的 HTTP API 请求，包括：
 * - 获取池子基础信息 (PoolBaseInfo)
 * - 获取池子动态数据 (PoolDataInfo)
 * - 获取代币列表 (TokenList)
 * - 搜索池子 (Search)
 * - 获取债务代币列表 (DebtTokenList)
 *
 * 【数据来源】
 * 所有数据来自 MySQL 数据库，这些数据由 schedule 模块从链上同步。
 * 控制器本身不直接与区块链交互。
 *
 * 【路由映射】
 * GET  /api/v{version}/poolBaseInfo   --> PoolBaseInfo()
 * GET  /api/v{version}/poolDataInfo   --> PoolDataInfo()
 * GET  /api/v{version}/token          --> TokenList()
 * POST /api/v{version}/pool/search    --> Search()
 * POST /api/v{version}/pool/debtTokenList --> DebtTokenList()
 * ==================================================================================
 */

package controllers

import (
	"pledge-backend/api/common/statecode"
	"pledge-backend/api/models"
	"pledge-backend/api/models/request"
	"pledge-backend/api/models/response"
	"pledge-backend/api/services"
	"pledge-backend/api/validate"
	"pledge-backend/config"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// PoolController - 借贷池控制器
type PoolController struct {
}

// PoolBaseInfo - 获取借贷池基础信息
// 【API】GET /api/v{version}/poolBaseInfo?chainId={chainId}
//
// 请求参数:
//   - chainId: 链 ID (97=测试网, 56=主网)
//
// 返回数据:
//   - 所有池子的基础配置信息列表 (来自 MySQL poolbases 表)
//
// 返回字段说明:
//   - pool_id: 池子 ID
//   - settle_time: 结算时间 (Unix 时间戳)
//   - end_time: 结束时间 (Unix 时间戳)
//   - interest_rate: 固定利率 (1e8 精度)
//   - state: 池子状态 (0=MATCH, 1=EXECUTION, 2=FINISH, 3=LIQUIDATION, 4=UNDONE)
//   - lend_token_info: 出借代币详情 (JSON)
//   - borrow_token_info: 抵押代币详情 (JSON)
func (c *PoolController) PoolBaseInfo(ctx *gin.Context) {
	res := response.Gin{Res: ctx}
	req := request.PoolBaseInfo{}
	var result []models.PoolBaseInfoRes

	// 1. 验证请求参数
	errCode := validate.NewPoolBaseInfo().PoolBaseInfo(ctx, &req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	// 2. 从数据库查询池子信息
	errCode = services.NewPool().PoolBaseInfo(req.ChainId, &result)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	// 3. 返回结果
	res.Response(ctx, statecode.CommonSuccess, result)
	return
}

// PoolDataInfo - 获取借贷池动态数据
// 【API】GET /api/v{version}/poolDataInfo?chainId={chainId}
//
// 请求参数:
//   - chainId: 链 ID
//
// 返回数据:
//   - 所有池子的运行时数据列表 (来自 MySQL pooldata 表)
//
// 返回字段说明:
//   - settle_amount_lend: 结算时锁定的出借金额
//   - settle_amount_borrow: 结算时锁定的抵押品数量
//   - finish_amount_lend: 正常结束时出借人可提取的本金+利息
//   - finish_amount_borrow: 正常结束时借款人可提取的抵押品
//   - liquidation_amoun_lend: 清算时出借人可提取的金额
//   - liquidation_amoun_borrow: 清算时借款人剩余抵押品
func (c *PoolController) PoolDataInfo(ctx *gin.Context) {
	res := response.Gin{Res: ctx}
	req := request.PoolDataInfo{}
	var result []models.PoolDataInfoRes

	errCode := validate.NewPoolDataInfo().PoolDataInfo(ctx, &req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	errCode = services.NewPool().PoolDataInfo(req.ChainId, &result)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	res.Response(ctx, statecode.CommonSuccess, result)
	return
}

// TokenList - 获取支持的代币列表
// 【API】GET /api/v{version}/token?chainId={chainId}
//
// 请求参数:
//   - chainId: 链 ID
//
// 返回数据:
//   - 符合 TokenList 标准格式的代币列表 (用于钱包/DEX 集成)
//
// 返回格式: 符合 Uniswap Token List 标准
func (c *PoolController) TokenList(ctx *gin.Context) {

	req := request.TokenList{}
	result := response.TokenList{}

	errCode := validate.NewTokenList().TokenList(ctx, &req)
	if errCode != statecode.CommonSuccess {
		ctx.JSON(200, map[string]string{
			"error": "chainId error",
		})
		return
	}

	// 从数据库获取代币列表
	errCode, data := services.NewTokenList().GetTokenList(&req)
	if errCode != statecode.CommonSuccess {
		ctx.JSON(200, map[string]string{
			"error": "chainId error",
		})
		return
	}

	// 构造符合 TokenList 标准的响应
	var BaseUrl = c.GetBaseUrl()
	result.Name = "Pledge Token List"
	result.LogoURI = BaseUrl + "storage/img/Pledge-project-logo.png"
	result.Timestamp = time.Now()
	result.Version = response.Version{
		Major: 2,
		Minor: 16,
		Patch: 12,
	}
	for _, v := range data {
		result.Tokens = append(result.Tokens, response.Token{
			Name:     v.Symbol,
			Symbol:   v.Symbol,
			Decimals: v.Decimals,
			Address:  v.Token,
			ChainID:  v.ChainId,
			LogoURI:  v.Logo,
		})
	}

	ctx.JSON(200, result)
	return
}

// Search - 搜索借贷池
// 【API】POST /api/v{version}/pool/search
//
// 请求参数 (JSON Body):
//   - 搜索条件 (具体字段见 request.Search)
//
// 返回数据:
//   - 符合条件的池子列表
//   - 总数量
func (c *PoolController) Search(ctx *gin.Context) {
	res := response.Gin{Res: ctx}
	req := request.Search{}
	result := response.Search{}

	errCode := validate.NewSearch().Search(ctx, &req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	errCode, count, pools := services.NewSearch().Search(&req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	result.Rows = pools
	result.Count = count
	res.Response(ctx, statecode.CommonSuccess, result)
	return
}

// DebtTokenList - 获取债务代币列表 (SP Token / JP Token)
// 【API】POST /api/v{version}/pool/debtTokenList
//
// 功能说明:
//
//	SP Token (存款凭证): 用户存入出借资金后获得，可用于提取本金+利息
//	JP Token (借款凭证): 用户存入抵押品后获得，可用于提取剩余抵押品
//
// 这些代币由 PledgePool 合约在用户存款时铸造 (mint)
func (c *PoolController) DebtTokenList(ctx *gin.Context) {
	res := response.Gin{Res: ctx}
	req := request.TokenList{}

	errCode := validate.NewTokenList().TokenList(ctx, &req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	errCode, result := services.NewTokenList().DebtTokenList(&req)
	if errCode != statecode.CommonSuccess {
		res.Response(ctx, errCode, nil)
		return
	}

	res.Response(ctx, statecode.CommonSuccess, result)
	return
}

// GetBaseUrl - 构造服务器基础 URL
// 用于生成静态资源的完整 URL (如代币 Logo)
func (c *PoolController) GetBaseUrl() string {

	domainName := config.Config.Env.DomainName
	domainNameSlice := strings.Split(domainName, "")
	pattern := "\\d+"
	// 判断域名是否以数字开头 (IP 地址)
	isNumber, _ := regexp.MatchString(pattern, domainNameSlice[0])
	if isNumber {
		// IP 地址格式: http://192.168.1.1:8080/
		return config.Config.Env.Protocol + "://" + config.Config.Env.DomainName + ":" + config.Config.Env.Port + "/"
	}
	// 域名格式: https://api.pledge.finance/
	return config.Config.Env.Protocol + "://" + config.Config.Env.DomainName + "/"
}
