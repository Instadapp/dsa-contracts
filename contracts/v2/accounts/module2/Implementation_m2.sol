pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { Variables } from "../variables.sol";

import { AccountInterface } from "../common/interfaces.sol";

/**
 * @title InstaAccountV2.
 * @dev DeFi Smart Account Wallet.
 */

interface ConnectorsInterface {
    function isConnectors(string[] calldata connectorNames) external view returns (bool, address[] memory);
}

contract Constants is Variables {
    // InstaIndex Address.
    address internal immutable limitOrderContract;
    // Connectors Address.
    address public immutable connectorsM1;

    constructor(address _limitOrderContract, address _connectors) {
        connectorsM1 = _connectors;
        limitOrderContract = _limitOrderContract;
    }
}

contract InstaImplementationM1 is Constants {

    constructor(address _limitOrderContract, address _connectors) Constants(_limitOrderContract, _connectors) {}

    event LogLimitOrderCast(
        address tokenFrom,
        address tokenTo,
        uint amountFrom,
        uint amountTo,
        uint32 _route
    );

    receive() external payable {}

    // TODO: Check encodes properly
    function getSpells(
        address tokenFrom,
        address tokenTo,
        uint amountFrom,
        uint amountTo,
        uint32 _route
    ) internal pure returns (
        string[] memory _targetNames,
        bytes memory _datas
    ) {
        if (_route == 1) {
            _targetNames[0] = 'COMPOUND-A';
            _targetNames[1] = 'COMPOUND-A';
            _datas[0] = abi.encodeWithSignature('deposit(address,uint,uint,uint)', [tokenFrom, amountFrom, 0, 0]);
            _datas[1] = abi.encodeWithSignature('withdraw(address,uint,uint,uint)', [tokenTo, amountTo, 0, 0]);
        } else if (_route == 2) {
            _targetNames[0] = 'COMPOUND-A';
            _targetNames[1] = 'COMPOUND-A';
            _datas[0] = abi.encodeWithSignature('payback(address,uint,uint,uint)', [tokenFrom, amountFrom, 0, 0]);
            _datas[1] = abi.encodeWithSignature('borrow(address,uint,uint,uint)', [tokenTo, amountTo, 0, 0]);
        } else if (_route == 3) {
            _targetNames[0] = 'AAVE-V2-A';
            _targetNames[1] = 'AAVE-V2-A';
            _datas[0] = abi.encodeWithSignature('deposit(address,uint,uint,uint)', [tokenFrom, amountFrom, 0, 0]);
            _datas[1] = abi.encodeWithSignature('withdraw(address,uint,uint,uint)', [tokenTo, amountTo, 0, 0]);
        } else if (_route == 4) {
            // only allow variable borrowing?
            _targetNames[0] = 'AAVE-V2-A';
            _targetNames[1] = 'AAVE-V2-A';
            _datas[0] = abi.encodeWithSignature('payback(address,uint,uint,uint,uint)', [tokenFrom, amountFrom, 2, 0, 0]);
            _datas[1] = abi.encodeWithSignature('borrow(address,uint,uint,uint,uint)', [tokenTo, amountTo, 2, 0, 0]);
        } else {
            require(false, "wrong-route");
        }
    }

    /**
     * @dev This is the main function, Where all the different functions are called
     * from Smart Account.
     * @param tokenFrom token to sell
     * @param tokenTo token to buy
    */
    function castLimitOrder(
        address tokenFrom,
        address tokenTo,
        uint amountFrom,
        uint amountTo,
        uint32 _route
    )
    external
    payable
    {   
        require(msg.sender == limitOrderContract, "2: not-limit-order-contract");

        (string[] memory _targetNames, bytes memory _datas) = getSpells(tokenFrom, tokenTo, amountFrom, amountTo, _route);

        AccountInterface(address(this)).cast(_targetNames, _datas, msg.sender);

        emit LogLimitOrderCast(tokenFrom, tokenTo, amountFrom, amountTo, _route);
    }

}
