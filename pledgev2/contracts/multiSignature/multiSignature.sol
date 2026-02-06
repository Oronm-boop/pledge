// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./multiSignatureClient.sol";

/**
 * @dev 地址白名单库
 * 用于管理地址数组的增删查操作，确保地址不重复。
 */
library whiteListAddress {
    // 添加地址到白名单 (如果不存在)
    function addWhiteListAddress(
        address[] storage whiteList,
        address temp
    ) internal {
        if (!isEligibleAddress(whiteList, temp)) {
            whiteList.push(temp);
        }
    }

    // 从白名单移除地址
    function removeWhiteListAddress(
        address[] storage whiteList,
        address temp
    ) internal returns (bool) {
        uint256 len = whiteList.length;
        uint256 i = 0;
        for (; i < len; i++) {
            if (whiteList[i] == temp) break;
        }
        if (i < len) {
            // 将最后一个元素移到被删除的位置，然后 pop，节省 gas
            if (i != len - 1) {
                whiteList[i] = whiteList[len - 1];
            }
            whiteList.pop();
            return true;
        }
        return false;
    }

    // 检查地址是否在白名单中
    function isEligibleAddress(
        address[] memory whiteList,
        address temp
    ) internal pure returns (bool) {
        uint256 len = whiteList.length;
        for (uint256 i = 0; i < len; i++) {
            if (whiteList[i] == temp) return true;
        }
        return false;
    }
}

/**
 * @dev 多签管理中心合约
 * 负责管理多签申请、收集签名以及验证签名状态。
 * 这个合约本身也继承了 multiSignatureClient (address(this))，意味着修改 owner 等操作也需要多签。
 */
contract multiSignature is multiSignatureClient {
    uint256 private constant defaultIndex = 0;
    using whiteListAddress for address[];

    // 多签拥有者列表 (管理员)
    address[] public signatureOwners;
    // 签名阈值 (最少需要多少人签名)
    uint256 public threshold;

    // 签名申请信息结构
    struct signatureInfo {
        address applicant; // 申请人 (发起该操作的人)
        address[] signatures; // 已签名该申请的管理员列表
    }

    // 映射: 消息哈希 => 签名申请列表
    // 一个哈希可能有多个申请记录 (虽然实际使用中 defaultIndex 限制了只用第一个)
    mapping(bytes32 => signatureInfo[]) public signatureMap;

    event TransferOwner(
        address indexed sender,
        address indexed oldOwner,
        address indexed newOwner
    );
    event CreateApplication(
        address indexed from,
        address indexed to,
        bytes32 indexed msgHash
    );
    event SignApplication(
        address indexed from,
        bytes32 indexed msgHash,
        uint256 index
    );
    event RevokeApplication(
        address indexed from,
        bytes32 indexed msgHash,
        uint256 index
    );

    constructor(
        address[] memory owners,
        uint256 limitedSignNum
    ) public multiSignatureClient(address(this)) {
        require(
            owners.length >= limitedSignNum,
            "Multiple Signature : Signature threshold is greater than owners' length!"
        );
        signatureOwners = owners;
        threshold = limitedSignNum;
    }

    // 转移管理员权限 (自身也受 validCall 多签保护)
    function transferOwner(
        uint256 index,
        address newOwner
    ) public onlyOwner validCall {
        require(
            index < signatureOwners.length,
            "Multiple Signature : Owner index is overflow!"
        );
        emit TransferOwner(msg.sender, signatureOwners[index], newOwner);
        signatureOwners[index] = newOwner;
    }

    /**
     * @dev 创建一个新的多签申请
     * @param to 目标合约地址 (例如 BscPledgeOracle)
     * @return index 申请在数组中的索引
     */
    function createApplication(address to) external returns (uint256) {
        bytes32 msghash = getApplicationHash(msg.sender, to);
        uint256 index = signatureMap[msghash].length;
        // 初始化一个新的申请，并没有签名
        signatureMap[msghash].push(signatureInfo(msg.sender, new address[](0)));
        emit CreateApplication(msg.sender, to, msghash);
        return index;
    }

    /**
     * @dev 管理员对申请进行签名
     * @param msghash 申请的消息哈希
     */
    function signApplication(
        bytes32 msghash
    ) external onlyOwner validIndex(msghash, defaultIndex) {
        emit SignApplication(msg.sender, msghash, defaultIndex);
        // 将调用者 (必须是 owner) 加入到该申请的已签名列表中
        signatureMap[msghash][defaultIndex].signatures.addWhiteListAddress(
            msg.sender
        );
    }

    /**
     * @dev 管理员撤销签名
     */
    function revokeSignApplication(
        bytes32 msghash
    ) external onlyOwner validIndex(msghash, defaultIndex) {
        emit RevokeApplication(msg.sender, msghash, defaultIndex);
        signatureMap[msghash][defaultIndex].signatures.removeWhiteListAddress(
            msg.sender
        );
    }

    /**
     * @dev 验证签名是否足够 (供 Client 调用)
     * @param msghash 消息哈希
     * @param lastIndex 上次检查的索引 (通常为0)
     * @return 如果签名数 >= 阈值，返回有效索引+1，否则返回0
     */
    function getValidSignature(
        bytes32 msghash,
        uint256 lastIndex
    ) external view returns (uint256) {
        signatureInfo[] storage info = signatureMap[msghash];
        for (uint256 i = lastIndex; i < info.length; i++) {
            if (info[i].signatures.length >= threshold) {
                return i + 1;
            }
        }
        return 0;
    }

    function getApplicationInfo(
        bytes32 msghash,
        uint256 index
    )
        public
        view
        validIndex(msghash, index)
        returns (address, address[] memory)
    {
        signatureInfo memory info = signatureMap[msghash][index];
        return (info.applicant, info.signatures);
    }

    function getApplicationCount(
        bytes32 msghash
    ) public view returns (uint256) {
        return signatureMap[msghash].length;
    }

    // 计算申请哈希: keccak256(申请人 + 目标合约)
    function getApplicationHash(
        address from,
        address to
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(from, to));
    }

    modifier onlyOwner() {
        require(
            signatureOwners.isEligibleAddress(msg.sender),
            "Multiple Signature : caller is not in the ownerList!"
        );
        _;
    }

    modifier validIndex(bytes32 msghash, uint256 index) {
        require(
            index < signatureMap[msghash].length,
            "Multiple Signature : Message index is overflow!"
        );
        _;
    }
}
