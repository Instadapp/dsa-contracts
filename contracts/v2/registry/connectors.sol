pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

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
    mapping(bytes32 => address) public connectors;

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

    function stringToBytes32(string memory str) internal pure returns (bytes32 result) {
        require(bytes(str).length != 0, "string-empty");
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            result := mload(add(str, 32))
        }
    }

}


contract InstaConnectorsV2 is Controllers {
    event LogConnectorAdded(bytes32 indexed connectorName, address indexed connector);
    event LogConnectorUpdated(bytes32 indexed connectorName, address indexed oldConnector, address indexed newConnector);
    event LogConnectorRemoved(bytes32 indexed connectorName, address indexed connector);

    /**
     * @dev Toggle Connectors - enable if disable & vice versa
     * @param _connectors Array of Connector Address.
    */
    function addConnectors(string[] calldata _connectorNames, address[] calldata _connectors) external isChief {
        require(_connectors.length == _connectors.length, "addConnectors: not same length");
        for (uint i = 0; i < _connectors.length; i++) {
            bytes32 connectorType = stringToBytes32(_connectorNames[i]);
            require(connectors[connectorType] == address(0), "addConnectors: _connectorName added already");
            connectors[connectorType] = _connectors[i];
            emit LogConnectorAdded(connectorType, _connectors[i]);
        }
    }


    function updateConnectors(string[] calldata _connectorNames, address[] calldata _connectors) external isChief {
        for (uint i = 0; i < _connectors.length; i++) {
            bytes32 connectorType = stringToBytes32(_connectorNames[i]);
            require(connectors[connectorType] != address(0), "addConnectors: _connectorName not added to update");
            require(_connectors[i] != address(0), "addConnectors: _connector address is not vaild");
            emit LogConnectorUpdated(connectorType, connectors[connectorType], _connectors[i]);
            connectors[connectorType] = _connectors[i];
        }
    }

    function removeConnectors(string[] calldata _connectorNames) external isChief {
        for (uint i = 0; i < _connectorNames.length; i++) {
            bytes32 connectorType = stringToBytes32(_connectorNames[i]);
            require(connectors[connectorType] != address(0), "addConnectors: _connectorName not added to update");
            emit LogConnectorRemoved(connectorType, connectors[connectorType]);
            delete connectors[connectorType];
        }
    }

    /**
     * @dev Check if Connector addresses are enabled.
     * @param _connectors Array of Connector Addresses.
    */
    function isConnectors(string[] calldata _connectorNames) external view returns (bool isOk, address[] memory _connectors) {
        isOk = true;
        uint len = _connectorNames.length;
        _connectors = new address[](len);
        for (uint i = 0; i < _connectors.length; i++) {
            _connectors[i] = connectors[stringToBytes32(_connectorNames[i])];
            if (_connectors[i] == address(0)) {
                isOk = false;
                break;
            }
        }
    }
}