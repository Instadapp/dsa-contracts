pragma solidity ^0.7.0;
import "hardhat/console.sol";
import { Variables } from "./variables.sol";


/**
 * @title InstaAccountV2.
 * @dev DeFi Smart Account Wallet.
 */

interface ConnectorsInterface {
    function isConnector(address[] calldata logicAddr) external view returns (bool);
}

contract Constants is Variables {
    // InstaIndex Address.
    address internal constant instaIndex = 0x2971AdFa57b20E5a416aE5a708A8655A9c74f723;
    // Connnectors Address.
    address public constant connectorsM1 = address(0);
}

contract InstaAccountV2ImplementationM1 is Constants {

    function decodeEvent(bytes memory response) internal pure returns (string memory _eventCode, bytes memory _eventParams) {
        (_eventCode, _eventParams) = abi.decode(response, (string, bytes));
    }

    event LogCast(
        address indexed origin,
        address indexed sender,
        uint value,
        address[] targets,
        string[] eventNames,
        bytes[] eventParams
    );

    receive() external payable {}

     /**
     * @dev Delegate the calls to Connector And this function is ran by cast().
     * @param _target Target to of Connector.
     * @param _data CallData of function in Connector.
    */
    function spell(address _target, bytes memory _data) internal returns (bytes memory response) {
        require(_target != address(0), "target-invalid");
        assembly {
            let succeeded := delegatecall(gas(), _target, add(_data, 0x20), mload(_data), 0, 0)
            let size := returndatasize()
            
            response := mload(0x40)
            mstore(0x40, add(response, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            mstore(response, size)
            returndatacopy(add(response, 0x20), 0, size)

            switch iszero(succeeded)
                case 1 {
                    // throw if delegatecall failed
                    returndatacopy(0x00, 0x00, size)
                    revert(0x00, size)
                }
        }
    }

    /**
     * @dev This is the main function, Where all the different functions are called
     * from Smart Account.
     * @param _targets Array of Target(s) to of Connector.
     * @param _datas Array of Calldata(S) of function.
    */
    function cast(
        address[] calldata _targets,
        bytes[] calldata _datas,
        address _origin
    )
    external
    payable 
    returns (bytes32) // Dummy return to fix instaIndex buildWithCast function
    {   
        uint256 _length = _targets.length;
        require(_auth[msg.sender] || msg.sender == instaIndex, "1: permission-denied");
        require(_length == _datas.length , "1: array-length-invalid");

        string[] memory eventNames = new string[](_length);
        bytes[] memory eventParams = new bytes[](_length);
        
        require(ConnectorsInterface(connectorsM1).isConnector(_targets), "1: not-connector");

        for (uint i = 0; i < _targets.length; i++) {
            bytes memory response = spell(_targets[i], _datas[i]);
            (eventNames[i], eventParams[i]) = decodeEvent(response);
        }

        emit LogCast(_origin, msg.sender, msg.value, _targets, eventNames, eventParams);
    }
}