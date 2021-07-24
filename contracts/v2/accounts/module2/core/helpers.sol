pragma solidity ^0.7.0;

import { Variables } from "./variables.sol";
import { DSMath } from "../../common/math.sol";
import { IERC20, SafeERC20, CTokenInterface } from "./interface.sol";
import { Basic } from "../../common/basic.sol";


contract Helpers is Variables, DSMath, Basic {
    using SafeERC20 for IERC20;

    function encodeTokenKey(address _tokenFrom, address _tokenTo) public pure returns (bytes32 _key) {
        _key = keccak256(abi.encode(_tokenFrom, _tokenTo));
    }

    function encodeDsaKey(address _dsa, uint32 _route)  public pure returns (bytes8 _key) {
        _key = bytes8(keccak256(abi.encode(_dsa, _route)));
    }

    // route = 1
    function checkUsersNetColCompound(address _dsa, uint _route) public view returns(bool, uint) {
        uint _netColBal;
        address[] memory _tokens = routeTokensArray[_route];
        for (uint i = 0; i < _tokens.length; i++) {
            IERC20 _token = IERC20(_tokens[i]);
            CTokenInterface _ctoken = tokenToCtoken[_tokens[i]];
            uint _ctokenBal = _ctoken.borrowBalanceStored(_dsa);
            uint _ctokenExchangeRate = _ctoken.exchangeRateStored();
            _netColBal += div(mul(_ctokenBal, _ctokenExchangeRate), 10 ** _token.decimals()); // 18 decimals for all tokens
        }
        return (minAmount < _netColBal, _netColBal);
    }

    // route = 2
    function checkUsersNetDebtCompound(address _dsa, uint _route) public view returns(bool, uint) {
        uint _netBorrowBal;
        address[] memory _tokens = routeTokensArray[_route];
        for (uint i = 0; i < _tokens.length; i++) {
            IERC20 _token = IERC20(_tokens[i]);
            CTokenInterface _ctoken = tokenToCtoken[_tokens[i]];
            uint _borrowBal = _ctoken.borrowBalanceStored(_dsa);
            _netBorrowBal += convertTo18(_token.decimals(), _borrowBal);
        }
        return (minAmount < _netBorrowBal, _netBorrowBal);
    }

    // route = 3
    function checkUsersNetColAave(address _dsa, uint _route) public view returns(bool, uint) {
        uint _netColBal;
        address[] memory _tokens = routeTokensArray[_route];
        for (uint i = 0; i < _tokens.length; i++) {
            (uint _supplyBal,,,,,,,,) = aaveData.getUserReserveData(_tokens[i], _dsa);
            _netColBal += _supplyBal;
        }
        return (minAmount < _netColBal, _netColBal);
    }

    // route = 4
    function checkUsersNetDebtAave(address _dsa, uint _route) public view returns(bool, uint) {
        uint _netBorrowBal;
        address[] memory _tokens = routeTokensArray[_route];
        for (uint i = 0; i < _tokens.length; i++) {
            (,,uint _borrowBal,,,,,,) = aaveData.getUserReserveData(_tokens[i], _dsa);
            _netBorrowBal += _borrowBal;
        }
        return (minAmount < _netBorrowBal, _netBorrowBal);
    }

    function checkUserPosition(address _dsa, uint _route) public view returns(bool _isOk, uint _netPos) {
        if (_route == 1) {
            (_isOk, _netPos) = checkUsersNetColCompound(_dsa, _route);
        } else if (_route == 2) {
            (_isOk, _netPos) = checkUsersNetDebtCompound(_dsa, _route);
        } else if (_route == 3) {
            (_isOk, _netPos) = checkUsersNetColAave(_dsa, _route);
        } else if (_route == 4) {
            (_isOk, _netPos) = checkUsersNetDebtAave(_dsa, _route);
        } else {
            _isOk = false;
        }
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
