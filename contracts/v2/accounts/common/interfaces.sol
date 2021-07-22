pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;


interface AccountInterface {

    function cast(
        string[] calldata _targetNames,
        bytes[] calldata _datas,
        address _origin
    )
    external
    payable 
    returns (bytes32);

    function castLimitOrder(
        address tokenFrom,
        address tokenTo,
        uint amountFrom,
        uint amountTo,
        uint32 _route
    )
    external
    payable;

}