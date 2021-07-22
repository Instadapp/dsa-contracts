pragma solidity ^0.7.0;

import { Variables } from "./variables.sol";
import { DSMath } from "../../common/math.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract Helpers is Variables, DSMath {
    using SafeERC20 for IERC20;

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

    function findCreatePosLoop(bytes32 _key, bytes8 _prevPosCheck, bytes8 _nextPosCheck, uint128 _price) view public returns(bytes8 _pos) {
        bool _isOkPrev;
        bool _isOkNext;
        if (_prevPosCheck == bytes8(0)) {
            _isOkPrev = true;
        } else {
            OrderList memory _prevOrder = ordersLists[_key][_prevPosCheck];
            if (_prevOrder.price <= _price) {
                _isOkPrev = true;
            }
        }
        if (_nextPosCheck == bytes8(0)) {
            _isOkNext = true;
        } else {
            OrderList memory _nextOrder = ordersLists[_key][_nextPosCheck];
            if (_price <= _nextOrder.price) {
                _isOkPrev = true;
            } else {
                _prevPosCheck = _nextPosCheck;
                _nextPosCheck = _nextOrder.next;
            }
        }
        if (_isOkPrev && _isOkNext) {
            _pos = _prevPosCheck;
        } else {
            _pos = findCreatePosLoop(_key, _prevPosCheck, _nextPosCheck, _price);
        }
    }

    function findCreatePos(bytes32 _key, uint128 _price) view public returns(bytes8 _pos) {
        OrderLink memory _link = ordersLinks[_key];
        if (_link.first == bytes8(0) && _link.last == bytes8(0) && _link.count == 0) {
            _pos = bytes8(0);
        } else {
            _pos = findCreatePosLoop(_key, bytes8(0), _link.first, _price);
        }
    }

    function checkPrice(uint128 price) public view {
        uint _min = sub(1e18, priceSlippage);
        uint _max = add(1e18, priceSlippage);
        require(_min < price && price < _max, "price-out-of-range");
    }

    modifier isDSA() {
        _;
    }

}
