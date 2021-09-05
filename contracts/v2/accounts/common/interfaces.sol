pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;


interface AccountInterface {

    function version() external view returns (uint);

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

interface TokenInterface {

    function totalSupply() external view returns (uint256);

    function decimals() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount) external returns (bool);

    function allowance(address owner, address spender) external view returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);

    event Approval(address indexed owner, address indexed spender, uint256 value);

}
