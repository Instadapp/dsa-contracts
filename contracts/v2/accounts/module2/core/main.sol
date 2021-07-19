pragma solidity ^0.7.0;


import { Helpers } from "./helpers.sol";

contract DeFiLimitOrder is Helpers {

    function create(address _tokenFrom, address _tokenTo, uint128 _price, uint32 _route, bytes8 _pos) public isDSA {
        require(route[_route], "wrong-route");
        bytes32 _key = encodeTokenKey(_tokenFrom, _tokenTo);
        bytes8 _key2 = encodeDsaKey(msg.sender, _route);
        // check if user's order already exists or not if yes then cancel it and then create new one.
        OrderLink memory _link = ordersLinks[_key];
        if (_pos == bytes8(0)) {
            if (_link.first == bytes8(0) && _link.last == bytes8(0) && _link.count == 0) { // if no previous order in the list
                ordersLists[_key][_key2] = OrderList(bytes8(0), bytes8(0), _price, _route, _tokenFrom, _tokenTo);
                ordersLinks[_key].first = _key2;
                ordersLinks[_key].last = _key2;
                ordersLinks[_key].count++;
            } else {
                OrderList memory _order = ordersLists[_key][_link.first];
                require(_price <= _order.price, "wrong-pos-1");
                ordersLists[_key][_key2] = OrderList(bytes8(0), _link.first, _price, _route, _tokenFrom, _tokenTo);
                ordersLists[_key][_link.first].prev = _key2;
                ordersLinks[_key].first = _key2;
                ordersLinks[_key].count++;
            }
        } else {
            OrderList memory _posExistingOrder = ordersLists[_key][_pos];
            if (_posExistingOrder.next == bytes8(0)) {
                require(_posExistingOrder.price <= _price, "wrong-pos-2");
                ordersLists[_key][_key2] = OrderList(_pos, bytes8(0), _price, _route, _tokenFrom, _tokenTo);
                ordersLists[_key][_pos].next = _key2;
                ordersLinks[_key].last = _key2;
                ordersLinks[_key].count++;
            } else {
                OrderList memory _posNextOrder = ordersLists[_key][_posExistingOrder.next];
                require(_posExistingOrder.price <= _price && _price <= _posNextOrder.price, "wrong-pos-2");
                ordersLists[_key][_key2] = OrderList(_pos, _posExistingOrder.next, _price, _route, _tokenFrom, _tokenTo);
                ordersLists[_key][_pos].next = _key2;
                ordersLists[_key][_posExistingOrder.next].prev = _key2;
                ordersLinks[_key].count++;
            }
        }
    }

    function create(address _tokenFrom, address _tokenTo, uint128 _price, uint32 _route) public isDSA {
        bytes8 _pos;
        bytes32 _key = encodeTokenKey(_tokenFrom, _tokenTo);
        bytes8 _key2 = encodeDsaKey(msg.sender, _route);
        OrderLink memory _link = ordersLinks[_key];
        if (_link.first == bytes8(0) && _link.last == bytes8(0)) {
            ordersLinks[_key].first = _key2;
            ordersLinks[_key].last = _key2;
            ordersLinks[_key].count++;
        } else {

        }
        create(_tokenFrom, _tokenTo, _price, _route, _pos);
    }

    function sell(address _tokenFrom, address _tokenTo, uint _amount, bytes8 _orderId) public {

    }

    function sell(address _tokenFrom, address _tokenTo, uint _amount, bytes8[] memory _orderIds, uint[] memory _distributions, uint _units) public {

    }

    // minAmount = minimum order amount to be used for swaps
    function sell(address _tokenFrom, address _tokenTo, uint _amount, uint _minAmount) public {

    }

    function cancel(address _tokenFrom, address _tokenTo, bytes8 _orderId) public {
        // only DSA
    }

    function cancelPublic(address _tokenFrom, address _tokenTo, bytes8 _orderId) public {
        // check is the limit order requirement is less than minAmount
    }

}
