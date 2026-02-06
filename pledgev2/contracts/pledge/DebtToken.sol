// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./AddressPrivileges.sol";

/**
 * @dev 债务代币合约。
 * 继承自 ERC20 和 AddressPrivileges。
 * 在 Pledge 系统中，DebtToken 用于代表用户的权益或债务。
 * 例如：spToken (Share Token for Lenders) 代表存款人的份额，jpToken (Joint Token for Borrowers) 可能代表借款人的债务凭证。
 * 只有拥有 Minter 权限的地址（通常是 PledgePool 合约）才能铸造和销毁此代币。
 */
contract DebtToken is ERC20, AddressPrivileges {
    constructor(
        string memory _name,
        string memory _symbol,
        address multiSignature
    ) public ERC20(_name, _symbol) AddressPrivileges(multiSignature) {}

    /**
     * @notice 铸造代币
     * @dev 仅允许 Minter 调用 (onlyMinter 权限控制)。
     * 通常在用户存款或借款发生时，由 PledgePool 调用此函数给用户发放凭证。
     * @param _to 接收代币的地址
     * @param _amount 铸造的数量
     * @return true 如果成功
     */
    function mint(
        address _to,
        uint256 _amount
    ) public onlyMinter returns (bool) {
        _mint(_to, _amount);
        return true;
    }

    /**
     * @notice 销毁代币
     * @dev 仅允许 Minter 调用。
     * 当用户取款或还款时，销毁相应的凭证。
     * @param _from 被销毁代币的持有者地址
     * @param _amount 销毁的数量
     * @return true 如果成功
     */
    function burn(
        address _from,
        uint256 _amount
    ) public onlyMinter returns (bool) {
        _burn(_from, _amount);
        return true;
    }
}
