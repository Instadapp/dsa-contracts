pragma solidity ^0.7.0;

import { Variables } from "./variables.sol";


contract Helpers is Variables {

    function encodeTokenKey(address _tokenFrom, address _tokenTo) public pure returns (bytes32 _key) {
        _key = keccak256(abi.encode(_tokenFrom, _tokenTo));
    }

    function encodeDsaKey(address _dsa, uint32 _route)  public pure returns (bytes8 _key) {
        _key = bytes8(keccak256(abi.encode(_dsa, _route)));
    }

    function checkUsersNetDebtCompound(address _user) public returns(bool, uint) {

    }

    function checkUsersNetColCompound(address _user) public returns(bool, uint) {

    }

    function checkUsersNetDebtAave(address _user) public returns(bool, uint) {

    }

    function checkUsersNetColAave(address _user) public returns(bool, uint) {

    }

    modifier isDSA() {
        _;
    }

}
