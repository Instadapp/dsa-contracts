pragma solidity ^0.7.0;


/**
 * @title InstaConnectors
 * @dev Registry for Connectors.
 */


interface IndexInterface {
    function master() external view returns (address);
}

interface ConnectorInterface {
    function name() external view returns (string memory);
}

contract Controllers {

    event LogController(address indexed addr, bool indexed isChief);

    // InstaIndex Address.
    address public constant instaIndex = 0x2971AdFa57b20E5a416aE5a708A8655A9c74f723;

    // Enabled Chief(Address of Chief => bool).
    mapping(address => bool) public chief;
    // Enabled Connectors(Connector Address => bool).
    mapping(address => bool) public connectors;

    /**
    * @dev Throws if the sender not is Master Address from InstaIndex
    * or Enabled Chief.
    */
    modifier isChief {
        require(chief[msg.sender] || msg.sender == IndexInterface(instaIndex).master(), "not-an-chief");
        _;
    }

    /**
     * @dev Toggle a Chief. Enable if disable & vice versa
     * @param _userAddress Chief Address.
    */
    function toggleChief(address _userAddress) external isChief {
        chief[_userAddress] = !chief[_userAddress];
        emit LogController(_userAddress, chief[_userAddress]);
    }

}


contract InstaConnectorsV2 is Controllers {

    event LogConnector(address indexed connector, bool isConnector);

    /**
     * @dev Toggle Connectors - enable if disable & vice versa
     * @param _connectors Array of Connector Address.
    */
    function toggleConnectors(address[] calldata _connectors) external isChief {
        for (uint i = 0; i < _connectors.length; i++) {
            connectors[_connectors[i]] = !connectors[_connectors[i]];
            emit LogConnector(_connectors[i], connectors[_connectors[i]]);
        }
    }


    /**
     * @dev Check if Connector addresses are enabled.
     * @param _connectors Array of Connector Addresses.
    */
    function isConnector(address[] calldata _connectors) external view returns (bool isOk) {
        isOk = true;
        for (uint i = 0; i < _connectors.length; i++) {
            if (!connectors[_connectors[i]]) {
                isOk = false;
                break;
            }
        }
    }

}