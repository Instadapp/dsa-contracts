pragma solidity ^0.6.0;

/**
 * @title InstaConnectors
 * @dev Registry for Connectors.
 */


interface IndexInterface {
    function master() external view returns (address);
}

interface ConnectorInterface {
    function connectorID() external view returns(uint _type, uint _id);
    function name() external view returns (string memory);
}


contract DSMath {

    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, "ds-math-add-overflow");
    }

    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }

}

contract Controllers is DSMath {

    event LogAddController(address addr);
    event LogRemoveController(address addr);

     // The InstaIndex Address.
    address public constant instaIndex = 0x0000000000000000000000000000000000000000;

    // Enabled Chief(Address of Chief => bool).
    mapping(address => bool) public chief;
    // Enabled Connectors(Connector Address => bool).
    mapping(address => bool) public connectors;
    // Enabled Static Connectors(Connector Address => bool).
    mapping(address => bool) public staticConnectors;

    /**
    * @dev Throws if the sender not is Master Address from InstaIndex
    * or Enabled Chief.
    */
    modifier isChief {
        require(chief[msg.sender] || msg.sender == IndexInterface(instaIndex).master(), "not-an-chief");
        _;
    }

    /**
     * @dev Enable a Chief.
     * @param _userAddress Chief Address.
    */
    function enableChief(address _userAddress) external isChief {
        chief[_userAddress] = true;
        emit LogAddController(_userAddress);
    }

    /**
     * @dev Disables a Chief.
     * @param _userAddress Chief Address.
    */
    function disableChief(address _userAddress) external isChief {
        delete chief[_userAddress];
        emit LogRemoveController(_userAddress);
    }

}


contract Listings is Controllers {
    // Connectors Array.
    address[] public connectorArray;
    // Count of Connector's Enabled.
    uint public connectorCount;

    /**
     * @dev Add Connector to Connector's array.
     * @param _connector Connector Address.
    **/
    function addToArr(address _connector) internal {
        require(_connector != address(0), "Not-vaild-connector");
        (, uint _id) = ConnectorInterface(_connector).connectorID();
        require(_id == (connectorArray.length+1),"ConnectorID-doesnt-match");
        ConnectorInterface(_connector).name(); // Checking if connector has function name()
        connectorArray.push(_connector);
    }

    // Static Connectors Array.
    address[] public staticConnectorArray;

    /**
     * @dev Add Connector to Static Connector's array.
     * @param _connector Static Connector Address.
    **/
    function addToArrStatic(address _connector) internal {
        require(_connector != address(0), "Not-vaild-connector");
        (, uint _id) = ConnectorInterface(_connector).connectorID();
        require(_id == (staticConnectorArray.length+1),"Connector-name-doesnt-match");
        ConnectorInterface(_connector).name(); // Checking if connector has function name()
        staticConnectorArray.push(_connector);
    }

}


contract InstaConnectors is Listings {

    event LogEnable(address indexed connector);
    event LogDisable(address indexed connector);
    event LogEnableStatic(address indexed connector);
    event LogDisableStatic(address indexed connector);
    event LogDisableStaticTimer(address indexed connector);

    /**
     * @dev Enable Connector.
     * @param _connector Connector Address.
    */
    function enable(address _connector) external isChief {
        require(!connectors[_connector], "already-enabled");
        addToArr(_connector);
        connectors[_connector] = true;
        connectorCount++;
        emit LogEnable(_connector);
    }
    /**
     * @dev Disable Connector.
     * @param _connector Connector Address.
    */
    function disable(address _connector) external isChief {
        require(connectors[_connector], "already-disabled");
        delete connectors[_connector];
        connectorCount--;
        emit LogDisable(_connector);
    }

    /**
     * @dev Enable Static Connector.
     * @param _connector Static Connector Address.
    */
    function enableStatic(address _connector) external isChief {
        require(!staticConnectors[_connector], "already-enabled");
        addToArrStatic(_connector);
        staticConnectors[_connector] = true;
        emit LogEnableStatic(_connector);
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

    /**
     * @dev Check if Connector addresses are static enabled.
     * @param _connectors Array of Connector Addresses.
    */
    function isStaticConnector(address[] calldata _connectors) external view returns (bool isOk) {
        isOk = true;
        for (uint i = 0; i < _connectors.length; i++) {
            if (!staticConnectors[_connectors[i]]) {
                isOk = false;
                break;
            }
        }
    }

}