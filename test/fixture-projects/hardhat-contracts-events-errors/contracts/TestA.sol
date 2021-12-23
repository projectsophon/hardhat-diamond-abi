// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

contract TestA {
  event Foo(uint256 id);
  error ErrFoo(uint256 id);

  function foo() public pure returns (bool) {
    return true;
  }
}
