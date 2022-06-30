// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract TestA {
    receive() external payable {}

    function foo() public pure returns (bool) {
        return true;
    }
}
