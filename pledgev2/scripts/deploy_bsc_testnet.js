// 完整的BSC测试网部署脚本
// 使用部署账户（PRIVATE_KEY对应的地址）作为唯一多签名管理员，阈值为1

require("dotenv").config(); // 确保在脚本开始时加载.env文件
const { ethers } = require("hardhat");

// BSC测试网PancakeSwap地址（使用现有的，不需要部署）
const BSC_TESTNET_WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
const BSC_TESTNET_PANCAKE_FACTORY = "0x6725F303b657a9451d8BA641348b6761A6CC7a17";
const BSC_TESTNET_PANCAKE_ROUTER = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";

async function main() {
    console.log("==========================================");
    console.log("开始部署到BSC测试网");
    console.log("==========================================\n");

    // 获取部署账户
    const [deployer] = await ethers.getSigners();
    console.log("部署账户:", deployer.address);
    console.log("账户余额:", ethers.utils.formatEther(await deployer.getBalance()), "BNB\n");

    // 使用部署账户作为唯一管理员（阈值设为1）
    const deployerAddress = deployer.address;
    console.log("部署账户（作为唯一管理员）:", deployerAddress);

    // 多签名管理员列表（只使用一个管理员，threshold设为1）
    // 使用部署账户（PRIVATE_KEY对应的地址）作为唯一管理员
    const multiSignatureOwners = [deployerAddress];
    const threshold = 1;

    console.log("多签名配置:");
    console.log("  管理员数量: 1");
    console.log("  阈值: 1（只需要1个签名即可执行操作）");

    console.log("\n==========================================");
    console.log("步骤 1: 部署 MultiSignature 合约");
    console.log("==========================================");
    const multiSignatureFactory = await ethers.getContractFactory("multiSignature");
    const multiSignature = await multiSignatureFactory.connect(deployer).deploy(
        multiSignatureOwners,
        threshold
    );
    await multiSignature.deployed();
    console.log("MultiSignature 地址:", multiSignature.address);
    const multiSignatureAddress = multiSignature.address;

    console.log("\n==========================================");
    console.log("步骤 2: 部署 BscPledgeOracle 合约");
    console.log("==========================================");
    const oracleFactory = await ethers.getContractFactory("BscPledgeOracle");
    const oracle = await oracleFactory.connect(deployer).deploy(multiSignatureAddress);
    await oracle.deployed();
    console.log("BscPledgeOracle 地址:", oracle.address);
    const oracleAddress = oracle.address;

    console.log("\n==========================================");
    console.log("步骤 3: 使用BSC测试网PancakeSwap地址");
    console.log("==========================================");
    // 使用BSC测试网现有的PancakeSwap地址，不需要部署
    const swapRouterAddress = BSC_TESTNET_PANCAKE_ROUTER;
    console.log("使用PancakeSwap Router地址:", swapRouterAddress);
    console.log("PancakeSwap Factory地址:", BSC_TESTNET_PANCAKE_FACTORY);
    console.log("WBNB地址:", BSC_TESTNET_WBNB);

    console.log("\n==========================================");
    console.log("步骤 4: 部署 DebtToken 合约");
    console.log("==========================================");
    // 部署 spBUSD
    const debtTokenFactory = await ethers.getContractFactory("DebtToken");
    const spBUSD = await debtTokenFactory.connect(deployer).deploy(
        "spBUSD_1",
        "spBUSD_1",
        multiSignatureAddress
    );
    await spBUSD.deployed();
    console.log("spBUSD (DebtToken) 地址:", spBUSD.address);

    // 部署 jpBTC
    const jpBTC = await debtTokenFactory.connect(deployer).deploy(
        "jpBTC_1",
        "jpBTC_1",
        multiSignatureAddress
    );
    await jpBTC.deployed();
    console.log("jpBTC (DebtToken) 地址:", jpBTC.address);

    console.log("\n==========================================");
    console.log("步骤 5: 部署 PledgePool 合约");
    console.log("==========================================");
    // feeAddress 使用部署账户地址
    const feeAddress = deployerAddress;
    const pledgePoolFactory = await ethers.getContractFactory("PledgePool");
    const pledgePool = await pledgePoolFactory.connect(deployer).deploy(
        oracleAddress,
        swapRouterAddress,
        feeAddress,
        multiSignatureAddress
    );
    await pledgePool.deployed();
    console.log("PledgePool 地址:", pledgePool.address);

    console.log("\n==========================================");
    console.log("部署完成！所有合约地址汇总：");
    console.log("==========================================");
    console.log("MultiSignature:", multiSignatureAddress);
    console.log("BscPledgeOracle:", oracleAddress);
    console.log("PancakeSwap Router:", swapRouterAddress);
    console.log("PancakeSwap Factory:", BSC_TESTNET_PANCAKE_FACTORY);
    console.log("WBNB:", BSC_TESTNET_WBNB);
    console.log("spBUSD (DebtToken):", spBUSD.address);
    console.log("jpBTC (DebtToken):", jpBTC.address);
    console.log("PledgePool:", pledgePool.address);
    console.log("Fee Address:", feeAddress);
    console.log("\n多签名管理员地址:");
    multiSignatureOwners.forEach((addr, index) => {
        console.log(`  管理员 ${index + 1}: ${addr}`);
    });
    console.log(`阈值: ${threshold}`);

    console.log("\n==========================================");
    console.log("开始验证合约代码...");
    console.log("==========================================");

    // 检查API Key
    const apiKey = process.env.BSCSCAN_API_KEY;
    if (!apiKey || apiKey === "") {
        console.log("⚠️  警告: 未找到BSCSCAN_API_KEY环境变量");
        console.log("   验证将跳过，您可以稍后手动验证合约");
        console.log("   手动验证命令示例:");
        console.log(`   npx hardhat verify --network bscTestnet ${multiSignatureAddress} "[${multiSignatureOwners.join(',')}]" ${threshold}`);
        return;
    }
    console.log("✅ 已找到BSCScan API Key");

    // 等待几个区块确认，确保合约在链上
    console.log("等待区块确认...");
    await new Promise(resolve => setTimeout(resolve, 20000)); // 等待20秒

    const hre = require("hardhat");

    // 验证 MultiSignature
    try {
        console.log("\n验证 MultiSignature 合约...");
        await hre.run("verify:verify", {
            address: multiSignatureAddress,
            constructorArguments: [multiSignatureOwners, threshold],
            network: "bscTestnet",
        });
        console.log("✅ MultiSignature 验证成功");
    } catch (error) {
        console.log("⚠️  MultiSignature 验证失败:", error.message);
        if (error.message.includes("apiKey") || error.message.includes("API key")) {
            console.log("   提示: 请检查.env文件中的BSCSCAN_API_KEY是否正确配置");
        }
    }

    // 验证 BscPledgeOracle
    try {
        console.log("\n验证 BscPledgeOracle 合约...");
        await hre.run("verify:verify", {
            address: oracleAddress,
            constructorArguments: [multiSignatureAddress],
            network: "bscTestnet",
        });
        console.log("✅ BscPledgeOracle 验证成功");
    } catch (error) {
        console.log("⚠️  BscPledgeOracle 验证失败:", error.message);
        if (error.message.includes("apiKey") || error.message.includes("API key")) {
            console.log("   提示: 请检查.env文件中的BSCSCAN_API_KEY是否正确配置");
        }
    }

    // 验证 spBUSD
    try {
        console.log("\n验证 spBUSD (DebtToken) 合约...");
        await hre.run("verify:verify", {
            address: spBUSD.address,
            constructorArguments: ["spBUSD_1", "spBUSD_1", multiSignatureAddress],
            network: "bscTestnet",
        });
        console.log("✅ spBUSD 验证成功");
    } catch (error) {
        console.log("⚠️  spBUSD 验证失败:", error.message);
        if (error.message.includes("apiKey") || error.message.includes("API key")) {
            console.log("   提示: 请检查.env文件中的BSCSCAN_API_KEY是否正确配置");
        }
    }

    // 验证 jpBTC
    try {
        console.log("\n验证 jpBTC (DebtToken) 合约...");
        await hre.run("verify:verify", {
            address: jpBTC.address,
            constructorArguments: ["jpBTC_1", "jpBTC_1", multiSignatureAddress],
            network: "bscTestnet",
        });
        console.log("✅ jpBTC 验证成功");
    } catch (error) {
        console.log("⚠️  jpBTC 验证失败:", error.message);
        if (error.message.includes("apiKey") || error.message.includes("API key")) {
            console.log("   提示: 请检查.env文件中的BSCSCAN_API_KEY是否正确配置");
        }
    }

    // 验证 PledgePool
    try {
        console.log("\n验证 PledgePool 合约...");
        await hre.run("verify:verify", {
            address: pledgePool.address,
            constructorArguments: [oracleAddress, swapRouterAddress, feeAddress, multiSignatureAddress],
            network: "bscTestnet",
        });
        console.log("✅ PledgePool 验证成功");
    } catch (error) {
        console.log("⚠️  PledgePool 验证失败:", error.message);
        if (error.message.includes("apiKey") || error.message.includes("API key")) {
            console.log("   提示: 请检查.env文件中的BSCSCAN_API_KEY是否正确配置");
        }
    }

    console.log("\n==========================================");
    console.log("验证完成！");
    console.log("==========================================");
    console.log("\n合约浏览器链接:");
    console.log("MultiSignature:", `https://testnet.bscscan.com/address/${multiSignatureAddress}#code`);
    console.log("BscPledgeOracle:", `https://testnet.bscscan.com/address/${oracleAddress}#code`);
    console.log("spBUSD:", `https://testnet.bscscan.com/address/${spBUSD.address}#code`);
    console.log("jpBTC:", `https://testnet.bscscan.com/address/${jpBTC.address}#code`);
    console.log("PledgePool:", `https://testnet.bscscan.com/address/${pledgePool.address}#code`);
    console.log("\n==========================================");
    console.log("部署信息已保存，请记录以上地址！");
    console.log("==========================================");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
