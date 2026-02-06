// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IMultiSignature {
    function getValidSignature(
        bytes32 msghash,
        uint256 lastIndex
    ) external view returns (uint256);
}

/**
 * @dev 多签客户端合约
 * 任何继承此合约的合约（如 PledgePool, BscPledgeOracle）都会受到多签保护。
 * 它使用 Assembly 来直接操作存储槽，以避免与继承合约的存储布局冲突。
 */
contract multiSignatureClient {
    // 多签合约地址在存储中的位置哈希
    uint256 private constant multiSignaturePositon =
        uint256(keccak256("org.multiSignature.storage"));
    uint256 private constant defaultIndex = 0;

    constructor(address multiSignature) public {
        require(
            multiSignature != address(0),
            "multiSignatureClient : Multiple signature contract address is zero!"
        );
        // 初始化时保存多签合约地址
        saveValue(multiSignaturePositon, uint256(multiSignature));
    }

    // 获取存储中的多签合约地址
    function getMultiSignatureAddress() public view returns (address) {
        return address(getValue(multiSignaturePositon));
    }

    // 核心修饰符：验证调用是否经过多签授权
    modifier validCall() {
        checkMultiSignature();
        _;
    }

    /**
     * @dev 检查多签授权逻辑
     * 1. 计算当前调用的消息哈希 (msg.sender + 当前合约地址)
     * 2. 调用多签合约查询该哈希是否有足够的签名
     */
    function checkMultiSignature() internal view {
        uint256 value;
        // 获取随调用发送的 ETH 值 (虽然此处未使用，可能是为了兼容性或检查)
        assembly {
            value := callvalue()
        }
        // 计算消息哈希：由调用者地址和当前合约地址组成
        // 这意味着同一个用户的同一个操作在不同合约中会产生不同的哈希
        bytes32 msgHash = keccak256(
            abi.encodePacked(msg.sender, address(this))
        );
        address multiSign = getMultiSignatureAddress();

        // 调用多签中心合约，检查是否满足签名阈值
        // defaultIndex = 0，表示从第一个签名记录开始检查
        uint256 newIndex = IMultiSignature(multiSign).getValidSignature(
            msgHash,
            defaultIndex
        );

        // 如果返回的索引 > 0，说明找到了有效的签名记录
        require(
            newIndex > defaultIndex,
            "multiSignatureClient : This tx is not aprroved"
        );
    }

    // 使用 Assembly 写入存储槽
    function saveValue(uint256 position, uint256 value) internal {
        assembly {
            sstore(position, value)
        }
    }

    // 使用 Assembly 读取存储槽
    function getValue(uint256 position) internal view returns (uint256 value) {
        assembly {
            value := sload(position)
        }
    }
}
