// SPDX-License-Identifier: MIT

pragma solidity =0.6.12;

contract MockMultiSignature {
    uint256 public threshold = 1;
    uint256 public defaultIndex = 1;
    
    function getValidSignature(bytes32 msghash, uint256 lastIndex) external view returns (uint256) {
        // Always return a valid signature for testing purposes
        return defaultIndex;
    }
}