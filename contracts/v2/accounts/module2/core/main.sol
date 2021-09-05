pragma solidity ^0.7.0;


import { Events } from "./events.sol";
import { Helpers } from "./helpers.sol";
import { AccountInterface, TokenInterface } from "../../common/interfaces.sol";
import { IERC20, SafeERC20, CTokenInterface } from "./interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Admin is Helpers, Ownable, Events {

    /**
     * @notice updates min amount needed to create an order.
     * @param _minAmount minimum amount in 18 decimals. 1e18 = 1$
    */
    function updateMinAmount(uint _minAmount) external onlyOwner {
        minAmount = _minAmount;
        emit LogMinAmount(_minAmount);
    }

    /**
     * @notice enable & disable routes. Initially there are 4 routes:
     * 1: collateral swap on Compound.
     * 2: debt swap on Compound.
     * 3: collateral swap on Aave.
     * 4: debt swap on Aave.
     * @param _route minimum amount in 18 decimals. 1e18 = 1$
    */
    function toggleRoute(uint _route) external onlyOwner {
        route[_route] = !route[_route];
        emit LogToggleRoute(_route, route[_route]);
    }

    /**
     * @notice updates the tokens allowed for a particular route. Deletes the old routing if any and sets up a new one.
     * @param _route route for which the update the tokens.
     * @param _tokens array of tokens to be enabled.
    */
    function updateRouteTokens(uint _route, address[] memory _tokens) external onlyOwner {
        require(route[_route], "route-not-enabled");
        for (uint i = 0; i < routeTokensArray[_route].length; i++) {
            delete routeTokenAllowed[_route][routeTokensArray[_route][i]];
        }
        routeTokensArray[_route] = _tokens;
        for (uint i = 0; i < _tokens.length; i++) {
            routeTokenAllowed[_route][_tokens[i]] = true;
        }
        emit LogUpdateRouteTokens(_route, _tokens);
    }

    /**
     * @notice updates token to ctoken mapping.
     * @param _tokens route for which the update the tokens.
     * @param _tokens array of tokens to be enabled.
    */
    function updateTokenToCtokenMap(address[] memory _tokens, address[] memory _ctokens) external onlyOwner {
        require(_tokens.length == _ctokens.length, "not-equal-length");
        for (uint i = 0; i < _tokens.length; i++) {
            if (_ctokens[i] != address(0) && _tokens[i] != address(0)) {
                tokenToCtoken[_tokens[i]] = _ctokens[i];
            } else {
                delete tokenToCtoken[_tokens[i]];
            }
        }
        emit LogUpdateTokenToCtokenMap(_tokens, _ctokens);
    }

    function updateCanCancel(address _user) external onlyOwner {
        canCancel[_user] = !canCancel[_user];
        emit LogUpdateCanCancel(_user, canCancel[_user]);
    }

}

contract Internals is Admin {
    using SafeERC20 for IERC20;

    function _sell(address _tokenFrom, address _tokenTo, uint _amountFrom, bytes8 _orderId) internal returns (uint _amountTo) {
        bytes32 _key = encodeTokenKey(_tokenTo, _tokenFrom); // inverse the params to get key as user is filling
        OrderList memory _order = ordersLists[_key][_orderId];
        require(_order.dsa != address(0), "order-does-not-exist");
        IERC20 _tokenFromContract = IERC20(_tokenFrom);
        _amountTo = div(mul(_amountFrom, 10 ** TokenInterface(_tokenTo).decimals()), _order.price);

        uint _value;
        if (_tokenFrom != ethAddr) {
            _tokenFromContract.safeTransfer(_order.dsa, _amountFrom);
        } else {
            _value = _amountFrom;
        }
        address _ctokenFrom;
        address _ctokenTo;
        if (_order.route == 1 || _order.route == 2) {
            _ctokenFrom = tokenToCtoken[_tokenFrom];
            _ctokenTo = tokenToCtoken[_tokenTo];
        }
        AccountInterface(_order.dsa).castLimitOrder{value: _value}
            (_tokenFrom, _tokenTo, _amountFrom, _amountTo, _order.route, _ctokenFrom, _ctokenTo);
    }

    function _cancel(bytes32 _key, OrderList memory _order, bytes8 _orderId) internal {
        ordersLinks[_key].count--;
        if (_order.prev == bytes8(0)) {
            ordersLinks[_key].first = _order.next;
        }
        if (_order.next == bytes8(0)) {
            ordersLinks[_key].last = _order.prev;
        }
        if (_order.prev != bytes8(0)) {
            ordersLists[_key][_order.prev].next = _order.next;
        }
        if (_order.next != bytes8(0)) {
            ordersLists[_key][_order.next].prev = _order.prev;
        }
        delete ordersLists[_key][_orderId];
    }

}

contract DeFiLimitOrder is Internals {
    using SafeERC20 for IERC20;

    // _pos = position after which order needs to be added
    function create(address _tokenFrom, address _tokenTo, uint128 _price, uint32 _route, bytes8 _pos) public isDSA {
        require(_tokenFrom != _tokenTo, "same-token-order-creation");
        require(route[_route], "wrong-route");
        require(routeTokenAllowed[_route][_tokenFrom] &&
            routeTokenAllowed[_route][_tokenTo], "token-not-enabled");
        if (_route == 1 || _route == 2) {
            require(tokenToCtoken[_tokenFrom] != address(0) && tokenToCtoken[_tokenTo] != address(0),
                "mapping-not-added");
        }
        (bool _isOk,) = checkUserPosition(msg.sender, uint(_route));
        require(_isOk, "not-valid-order");
        bytes32 _key = encodeTokenKey(_tokenFrom, _tokenTo);
        bytes8 _key2 = encodeDsaKey(msg.sender, _route);
        OrderList memory _orderExists = ordersLists[_key][_key2];
        if (_orderExists.dsa != address(0)) { // does similar order exist (same token for same route)
            _cancel(_key, _orderExists, _key2);
            emit LogCancelCreate(_tokenFrom, _tokenTo, _key2);
        }
        OrderLink memory _link = ordersLinks[_key];
        if (_pos == bytes8(0)) { // if position is first
            if (_link.first == bytes8(0) && _link.last == bytes8(0) && _link.count == 0) { // if no previous order in the list
                ordersLists[_key][_key2] = OrderList(bytes8(0), bytes8(0), _price, _route, _tokenFrom, _tokenTo, msg.sender);
                ordersLinks[_key].first = _key2;
                ordersLinks[_key].last = _key2;
                ordersLinks[_key].count++;
            } else {
                OrderList memory _order = ordersLists[_key][_link.first];
                require(_price <= _order.price, "wrong-pos-1");
                ordersLists[_key][_key2] = OrderList(bytes8(0), _link.first, _price, _route, _tokenFrom, _tokenTo, msg.sender);
                ordersLists[_key][_link.first].prev = _key2;
                ordersLinks[_key].first = _key2;
                ordersLinks[_key].count++;
            }
        } else {
            OrderList memory _posExistingOrder = ordersLists[_key][_pos];
            if (_posExistingOrder.next == bytes8(0)) {
                require(_posExistingOrder.price <= _price, "wrong-pos-2");
                ordersLists[_key][_key2] = OrderList(_pos, bytes8(0), _price, _route, _tokenFrom, _tokenTo, msg.sender);
                ordersLists[_key][_pos].next = _key2;
                ordersLinks[_key].last = _key2;
                ordersLinks[_key].count++;
            } else {
                OrderList memory _posNextOrder = ordersLists[_key][_posExistingOrder.next];
                require(_posExistingOrder.price <= _price && _price <= _posNextOrder.price, "wrong-pos-3");
                ordersLists[_key][_key2] = OrderList(_pos, _posExistingOrder.next, _price, _route, _tokenFrom, _tokenTo, msg.sender);
                ordersLists[_key][_pos].next = _key2;
                ordersLists[_key][_posExistingOrder.next].prev = _key2;
                ordersLinks[_key].count++;
            }
        }
        emit LogCreate(_tokenFrom, _tokenTo, _price, _route, _pos);
    }

    function create(address _tokenFrom, address _tokenTo, uint128 _price, uint32 _route) external isDSA {
        bytes32 _key = encodeTokenKey(_tokenFrom, _tokenTo);
        bytes8 _pos = findCreatePos(_key, _price);
        create(_tokenFrom, _tokenTo, _price, _route, _pos);
    }

    function sell(address _tokenFrom, address _tokenTo, uint _amountFrom, uint _minAmountTo, bytes8 _orderId, address _to) external payable returns (uint _amountTo) {
        if (_tokenFrom != ethAddr) {
            IERC20(_tokenFrom).safeTransferFrom(msg.sender, address(this), _amountFrom);
        }
        _amountTo = _sell(_tokenFrom, _tokenTo, _amountFrom, _orderId);
        require(_minAmountTo < _amountTo, "excess-slippage");
        if (_tokenTo != ethAddr) {
            IERC20(_tokenTo).safeTransfer(_to, _amountTo);
        } else {
            _to.call{value: _amountTo}("");
        }
        emit LogSell(_tokenFrom, _tokenTo, _amountFrom, _amountTo, _orderId, _to);
    }

    function sell(
        address _tokenFrom,
        address _tokenTo,
        uint _amountFrom,
        uint _minAmountTo,
        bytes8[] memory _orderIds,
        uint[] memory _distributions,
        uint _units,
        address _to
    ) external payable returns (uint _amountTo) {
        require(_orderIds.length == _distributions.length, "not-equal-length");
        if (_tokenFrom != ethAddr) {
            IERC20(_tokenFrom).safeTransferFrom(msg.sender, address(this), _amountFrom);
        }
        for (uint i = 0; i < _distributions.length; i++) {
            uint _amountFromPerOrder = div(mul(_amountFrom, _distributions[i]), _units);
            _amountTo = add(_amountTo, _sell(_tokenFrom, _tokenTo, _amountFromPerOrder, _orderIds[i]));
        }
        require(_minAmountTo < _amountTo, "excess-slippage");
        if (_tokenTo != ethAddr) {
            IERC20(_tokenTo).safeTransfer(_to, _amountTo);
        } else {
            _to.call{value: _amountTo}("");
        }
        emit LogSell(
            _tokenFrom,
            _tokenTo,
            _amountFrom,
            _amountTo,
            _orderIds,
            _distributions,
            _units,
            _to
        );
    }

    function cancel(address _tokenFrom, address _tokenTo, bytes8 _orderId) public {
        bytes32 _key = encodeTokenKey(_tokenFrom, _tokenTo);
        OrderList memory _order = ordersLists[_key][_orderId];
        require(_order.dsa == msg.sender, "not-the-order-owner");
        _cancel(_key, _order, _orderId);
        emit LogCancel(_tokenFrom, _tokenTo, _orderId);
    }

    // The enabled addresses can cancel any order anytime. Doesn't result in risk to users assets
    function cancelOwner(address _tokenFrom, address _tokenTo, bytes8 _orderId) public {
        require(canCancel[msg.sender], "not-enabled-for-cancellation");
        bytes32 _key = encodeTokenKey(_tokenFrom, _tokenTo);
        OrderList memory _order = ordersLists[_key][_orderId];
        _cancel(_key, _order, _orderId);
        emit LogCancelOwner(_tokenFrom, _tokenTo, _orderId);
    }

    function cancelPublic(address _tokenFrom, address _tokenTo, bytes8 _orderId) public {
        bytes32 _key = encodeTokenKey(_tokenFrom, _tokenTo);
        OrderList memory _order = ordersLists[_key][_orderId];
        (bool _isOk,) = checkUserPosition(_order.dsa, uint(_order.route));
        require(!_isOk, "order-meets-min-requirement");
        _cancel(_key, _order, _orderId);
        emit LogCancelPublic(_tokenFrom, _tokenTo, _orderId);
    }

}
