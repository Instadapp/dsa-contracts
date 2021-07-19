pragma solidity ^0.7.0;

import { IERC20, SafeERC20 } from "./interface.sol";

contract Variables {

    mapping (address => bool) public tokenWhitelisted; // white listed stable coins

    uint public minAmount; // Minimum $ of debt or collateral (in all the white listed tokens combine) to create an order
    mapping (uint => bool) public route;
    mapping (uint => mapping (address => bool)) public routeTokenAllowed;

    mapping (bytes32 => OrderLink) public ordersLinks;
    mapping (bytes32 => mapping (bytes8 => OrderList)) public ordersLists; // abi.encode(tokenFrom, tokenTo) => DSA => DSA's order

    struct OrderLink {
        bytes8 first;
        bytes8 last;
        uint64 count;
    }

    struct OrderList {
        bytes8 prev;
        bytes8 next;
        uint128 price; // price in 18 decimals
        uint32 route; // which route to take Eg:- payback & borrow from Aave. 
        address tokenFrom;
        address tokenTo;
    }

}
