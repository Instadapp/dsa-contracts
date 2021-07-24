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

    constructor(address _limitOrderContract) {
        limitOrderContract = _limitOrderContract;
    }
}

contract InstaImplementationM1 is Constants {

    constructor(address _limitOrderContract, address _connectors) Constants(_limitOrderContract) {}

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
    ) internal view returns (
        string[] memory _targetNames,
        bytes[] memory _castData
    ) {
        _targetNames = new string[](3);
        _castData = new bytes[](3);
        if (_route == 1) {
            _targetNames[0] = 'COMPOUND-A';
            _targetNames[1] = 'COMPOUND-A';
            _castData[0] = abi.encodeWithSignature('deposit(address,uint256,uint256,uint256)', tokenFrom, amountFrom, 0, 0);
            _castData[1] = abi.encodeWithSignature('withdraw(address,uint256,uint256,uint256)', tokenTo, amountTo, 0, 0);
        } else if (_route == 2) {
            _targetNames[0] = 'COMPOUND-A';
            _targetNames[1] = 'COMPOUND-A';
            _castData[0] = abi.encodeWithSignature('payback(address,uint256,uint256,uint256)', tokenFrom, amountFrom, 0, 0);
            _castData[1] = abi.encodeWithSignature('borrow(address,uint256,uint256,uint256)', tokenTo, amountTo, 0, 0);
        } else if (_route == 3) {
            _targetNames[0] = 'AAVE-V2-A';
            _targetNames[1] = 'AAVE-V2-A';
            _castData[0] = abi.encodeWithSignature('deposit(address,uint256,uint256,uint256)', tokenFrom, amountFrom, 0, 0);
            _castData[1] = abi.encodeWithSignature('withdraw(address,uint256,uint256,uint256)', tokenTo, amountTo, 0, 0);
        } else if (_route == 4) {
            // only allowing variable borrowing
            _targetNames[0] = 'AAVE-V2-A';
            _targetNames[1] = 'AAVE-V2-A';
            _castData[0] = abi.encodeWithSignature('payback(address,uint256,uint256,uint256,uint256)', tokenFrom, amountFrom, 2, 0, 0);
            _castData[1] = abi.encodeWithSignature('borrow(address,uint256,uint256,uint256,uint256)', tokenTo, amountTo, 2, 0, 0);
        } else {
            require(false, "wrong-route");
        }
        _targetNames[2] = 'BASIC-A';
        _castData[2] = abi.encodeWithSignature('withdraw(address,uint256,address,uint256,uint256)', tokenTo, amountTo, limitOrderContract, 0, 0);
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

        (string[] memory _targetNames, bytes[] memory _castData) = getSpells(tokenFrom, tokenTo, amountFrom, amountTo, _route);

        AccountInterface(address(this)).cast(_targetNames, _castData, msg.sender);

        emit LogLimitOrderCast(tokenFrom, tokenTo, amountFrom, amountTo, _route);
    }

}
