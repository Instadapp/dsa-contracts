# Implementation Module 2

## Contract Types
- Implementation_m2.sol (New implementation to add in DSL - DeFi Smart Layer)
- core (Seperate contract to handle all the limit orders of all users, only this contract have access to access module 2 on DSAs)

## Contracts
### Implementation_m2.sol
- `castLimitOrder(address tokenFrom, address tokenTo, uint amountFrom, uint amountTo, uint32 _route)`
Encodes the connectors spells and calls the `cast()` function present in module 1 which has connectors enabled for all the protocols added to DSL.

### Core
- `create(address _tokenFrom, address _tokenTo, uint128 _price, uint32 _route, bytes8 _pos)`
Creates Limit Order and add it to the linked list. Gas optimised function.

- `create(address _tokenFrom, address _tokenTo, uint128 _price, uint32 _route)`
Creates Limit Order and add it to the linked list. Search through the linked list to see where it fits.

- `sell(address _tokenFrom, address _tokenTo, uint _amountFrom, bytes8 _orderId, address _to)`
Do the swap using a single order.

- `sell(address _tokenFrom, address _tokenTo, uint _amountFrom, bytes8[] memory _orderIds, uint[] memory _distributions, uint _units, address _to)`
Do the swap on multiple orders. Distribution helps in distribute the amount between different orders.

- `cancel(address _tokenFrom, address _tokenTo, bytes8 _orderId)`
Cancel the order. Only DSA owner can cancel their own order.

- `cancelPublic(address _tokenFrom, address _tokenTo, bytes8 _orderId)`
Anyone can cancel publicly if the order doesn't satisfy all the requirements.


## Interaction Flow
**Create Order**
Owner -> `cast()` on module 1 with Limit Order connector which calls `create()` in `core`.

**Swap**
Traders calls `sell()` which interacts with DSAs according to the order.

**cancel**
Owner -> `cast()` on module 1 with Limit Order connector which calls `cancel()` in `core`.

**cancelPublic**
Anyone calls `cancelPublic()`
