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

    // Enabled Cheif(Address of Cheif => bool).
    mapping(address => bool) public chief;
    // Enabled Connectors(Connector Address => bool).
    mapping(address => bool) public connectors;
    // Enbled Static Connectors(Connector Address => bool).
    mapping(address => bool) public staticConnectors;

    /**
    * @dev Throws if the sender not is Master Address from InstaIndex
    * or Enabled Cheif.
    */
    modifier isChief {
        require(chief[msg.sender] || msg.sender == IndexInterface(instaIndex).master(), "not-an-chief");
        _;
    }

    /**
     * @dev Enable a Cheif.
     * @param _userAddress Cheif Address.
    */
    function enableChief(address _userAddress) external isChief {
        chief[_userAddress] = true;
        emit LogAddController(_userAddress);
    }

    /**
     * @dev Disables a Cheif.
     * @param _userAddress Cheif Address.
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
    // Count of Static Connector's Enabled.
    uint public staticConnectorCount;

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

    // Static Connector Disable Timer (Static Connector => Timer).
    mapping (address => uint) public staticTimer;

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
        staticConnectorCount++;
        emit LogEnableStatic(_connector);
    }

    /**
     * @dev Disable Static Connector.
     * @param _connector Static Connector Address.
     * @param reset reset timer.
    */
    function disableStatic(address _connector, bool reset) external isChief {
        require(staticConnectors[_connector], "already-disabled");
        if (!reset) {
            if(staticTimer[_connector] == 0){
                staticTimer[_connector] = now + 30 days;
                emit LogDisableStaticTimer(_connector);
            } else {
                require(staticTimer[_connector] <= now, "less-than-30-days");
                staticConnectorCount--;
                delete staticConnectors[_connector];
                delete staticTimer[_connector];
                emit LogDisableStatic(_connector);
            }
        } else {
            require(staticTimer[_connector] != 0, "timer-not-set");
            delete staticTimer[_connector];
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