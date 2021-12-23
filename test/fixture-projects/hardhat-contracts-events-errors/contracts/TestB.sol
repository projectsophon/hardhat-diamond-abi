// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract TestB {
  event Bar(uint256 id);
  error ErrBar(uint256 id);

  function bar() public pure returns (bool) {
    return false;
  }
}
