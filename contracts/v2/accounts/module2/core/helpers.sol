pragma solidity ^0.7.0;

import { Variables } from "./variables.sol";
import { DSMath } from "../../common/math.sol";
import { AccountInterface } from "../../common/interfaces.sol";
import { IERC20, SafeERC20, CTokenInterface, OracleComp, AaveLendingPool, AavePriceOracle } from "./interface.sol";
import { Basic } from "../../common/basic.sol";


contract Helpers is Variables, DSMath, Basic {
    using SafeERC20 for IERC20;


    function encodeTokenKey(address _tokenFrom, address _tokenTo) public pure returns (bytes32 _key) {
        _key = keccak256(abi.encode(_tokenFrom, _tokenTo));
    }

    function encodeDsaKey(address _dsa, uint32 _route) public pure returns (bytes8 _key) {
        _key = bytes8(keccak256(abi.encode(_dsa, _route)));
    }

    // route = 1
    function checkUsersNetColCompound(address _dsa, uint _route) private view returns(bool, uint) {
        uint _netColBal; // net collateral value in USD
        OracleComp _oracleComp = OracleComp(comptroller.oracle());
        address[] memory _ctokens = comptroller.getAssetsIn(_dsa);
        for (uint i = 0; i < _ctokens.length; i++) {
            CTokenInterface _ctoken = CTokenInterface(_ctokens[i]);
            IERC20 _token = IERC20(_ctoken.underlying());
            uint _decimals = _token.decimals();
            uint _price = div(_oracleComp.getUnderlyingPrice(_ctokens[i]), 10 ** (18 - _decimals));
            uint _ctokenBal = _ctoken.balanceOf(_dsa);
            uint _ctokenExchangeRate = _ctoken.exchangeRateStored();
            uint _tknBal = div(mul(_ctokenBal, _ctokenExchangeRate), 10 ** _decimals);
            _netColBal += wmul(_tknBal, _price);
        }
        return (minAmount < _netColBal, _netColBal);
    }

    // route = 2
    function checkUsersNetDebtCompound(address _dsa, uint _route) private view returns(bool, uint) {
        uint _netBorrowBal;
        // address[] memory _tokens = routeTokensArray[_route];
        OracleComp _oracleComp = OracleComp(comptroller.oracle());
        address[] memory _ctokens = comptroller.getAssetsIn(_dsa);
        for (uint i = 0; i < _ctokens.length; i++) {
            CTokenInterface _ctoken = CTokenInterface(_ctokens[i]);
            IERC20 _token = IERC20(_ctoken.underlying());
            uint _decimals = _token.decimals();
            uint _price = div(_oracleComp.getUnderlyingPrice(_ctokens[i]), 10 ** (18 - _decimals));
            uint _borrowBal = _ctoken.borrowBalanceStored(_dsa);
            uint _tknBal = mul(_borrowBal, 10 ** (18 - _decimals));
            _netBorrowBal += wmul(_tknBal, _price);
        }
        return (minAmount < _netBorrowBal, _netBorrowBal);
    }

    // route = 3
    function checkUsersNetColAave(address _dsa, uint _route) private view returns(bool, uint) {
        uint _netColInUsd;
        (uint totalColInEth, , , , , ) = AaveLendingPool(
                aaveAddressProvider.getLendingPool()
            ).getUserAccountData(_dsa);
        AavePriceOracle _oracleContract = AavePriceOracle(aaveAddressProvider.getPriceOracle());
        uint _price = _oracleContract.getAssetPrice(usdcAddr);
        _netColInUsd = wdiv(totalColInEth, _price);
        return (minAmount < _netColInUsd, _netColInUsd);
    }

    // route = 4
    function checkUsersNetDebtAave(address _dsa, uint _route) private view returns(bool, uint) {
        uint _netDebtInUsd;
        (, uint totalDebtInEth, , , , ) = AaveLendingPool(
                aaveAddressProvider.getLendingPool()
            ).getUserAccountData(_dsa);
        AavePriceOracle _oracleContract = AavePriceOracle(aaveAddressProvider.getPriceOracle());
        uint _price = _oracleContract.getAssetPrice(usdcAddr);
        _netDebtInUsd = wdiv(totalDebtInEth, _price);
        return (minAmount < _netDebtInUsd, _netDebtInUsd);
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

    function findCreatePosLoop(bytes32 _key, bytes8 _prevPosCheck, bytes8 _nextPosCheck, uint128 _price) private view returns(bytes8 _pos) {
        bool _isOkPrev;
        bool _isOkNext;
        bytes8 _nextOrderKey;
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
                _isOkNext = true;
            } else {
                _nextOrderKey = _nextOrder.next;
            }
        }
        if (_isOkPrev && _isOkNext) {
            _pos = _prevPosCheck;
        } else {
            _prevPosCheck = _nextPosCheck;
            _nextPosCheck = _nextOrderKey;
            _pos = findCreatePosLoop(_key, _prevPosCheck, _nextPosCheck, _price);
        }
    }

    function findCreatePos(bytes32 _key, uint128 _price) public view returns (bytes8 _pos) {
        OrderLink memory _link = ordersLinks[_key];
        if (_link.first == bytes8(0) && _link.last == bytes8(0) && _link.count == 0) {
            _pos = bytes8(0);
        } else {
            _pos = findCreatePosLoop(_key, bytes8(0), _link.first, _price);
        }
    }

    modifier isDSA() {
        uint64 _dsaId = instaList.accountID(msg.sender);
        uint _verion = AccountInterface(msg.sender).version();
        require(_dsaId != 0, "not-a-dsa");
        require(_verion == 2, "not-dsa-v2");
        _;
    }

    function getRouteTokensArrayLength(uint _route) public view returns (uint _length) {
        _length = routeTokensArray[_route].length;
    }

}
