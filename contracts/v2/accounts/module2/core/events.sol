pragma solidity ^0.7.0;


contract Events {
    event LogMinAmount(uint _minAmount);
    event LogPriceSlippage(uint _priceSlippage);
    event LogToggleRoute(uint _route, bool _isEnabled);
    event LogUpdateRouteTokens(uint _route, address[] _tokens);
    event LogUpdateTokenToCtokenMap(address[] _tokens, address[] _ctokens);
    event LogToggleCanCancel(address _user, bool _canCancel);
    event LogCreate(address _tokenFrom, address _tokenTo, uint128 _price, uint32 _route, bytes8 _pos);
    event LogSell(address _tokenFrom, address _tokenTo, uint _amountFrom, uint _amountTo, bytes8 _orderId, address _to);
    event LogSell(
        address _tokenFrom,
        address _tokenTo,
        uint _amountFrom,
        uint _amountTo,
        bytes8[] _orderIds,
        uint[] _distributions,
        uint _units,
        address _to
    );
    event LogCancel(address _tokenFrom, address _tokenTo, bytes8 _orderId);
    event LogCancelOwner(address _tokenFrom, address _tokenTo, bytes8 _orderId);
    event LogCancelPublic(address _tokenFrom, address _tokenTo, bytes8 _orderId);
    event LogCancelCreate(address _tokenFrom, address _tokenTo, bytes8 _orderId);
}