// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../multiSignature/multiSignatureClient.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

/**
 * @dev 包含与地址类型相关的函数的合约。
 * 主要用于管理具有特定权限（如铸造者 Minter）的地址集合。
 * 继承自 `multiSignatureClient`，意味着关键操作可能需要多签授权。
 */
contract AddressPrivileges is multiSignatureClient {
    constructor(
        address multiSignature
    ) public multiSignatureClient(multiSignature) {}

    // 使用 EnumerableSet 库来管理地址集合，支持枚举（遍历）操作
    using EnumerableSet for EnumerableSet.AddressSet;
    // 存储所有拥有 Minter（铸造者）权限的地址集合
    EnumerableSet.AddressSet private _minters;

    /**
     * @notice 添加一个铸造者 (Minter)
     * @dev 用于给某个地址授权 Minter 权限。
     * 这里的 `validCall` 修饰符意味着只有通过多签验证的调用才能执行此函数。
     * @param _addMinter 要添加的 Minter 地址
     * @return true 如果添加成功，否则失败
     */
    function addMinter(address _addMinter) public validCall returns (bool) {
        require(
            _addMinter != address(0),
            "Token: _addMinter is the zero address"
        ); // 禁止添加零地址
        return EnumerableSet.add(_minters, _addMinter);
    }

    /**
     * @notice 删除一个铸造者 (Minter)
     * @dev 用于移除某个地址的 Minter 权限。
     * 同样受到 `validCall` 保护，需要多签授权。
     * @param _delMinter 要删除的 Minter 地址
     * @return true 如果删除成功，否则失败
     */
    function delMinter(address _delMinter) public validCall returns (bool) {
        require(
            _delMinter != address(0),
            "Token: _delMinter is the zero address"
        ); // 禁止删除零地址
        return EnumerableSet.remove(_minters, _delMinter);
    }

    /**
     * @notice 获取铸造者列表的长度
     * @dev 查看当前有多少个地址拥有 Minter 权限
     * @return Minter 列表的长度
     */
    function getMinterLength() public view returns (uint256) {
        return EnumerableSet.length(_minters);
    }

    /**
     * @notice 判断该地址是否为铸造者 (Minter)
     * @dev 检查特定地址是否存在于 _minters 集合中
     * @param account 要检查的地址
     * @return true 如果是 Minter，否则返回 false
     */
    function isMinter(address account) public view returns (bool) {
        return EnumerableSet.contains(_minters, account);
    }

    /**
     * @notice 根据索引获取铸造者账户
     * @dev 用于遍历所有 Minter 地址
     * @param _index 索引值 (0 到 length-1)
     * @return 对应索引的 Minter 地址
     */
    function getMinter(uint256 _index) public view returns (address) {
        require(_index <= getMinterLength() - 1, "Token: index out of bounds"); // 防止索引越界
        return EnumerableSet.at(_minters, _index);
    }

    // 修饰符：仅允许 Minter 调用
    // 用于保护只有被授权为 Minter 的地址（如 PledgePool 合约）才能调用的函数
    modifier onlyMinter() {
        require(isMinter(msg.sender), "Token: caller is not the minter");
        _;
    }
}
