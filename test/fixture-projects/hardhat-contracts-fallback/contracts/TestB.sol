// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract TestB {
    fallback() external payable {}

    function bar() public pure returns (bool) {
        return false;
    }
}
