pragma solidity ^0.6.0;

/**
 * @title InstaConnectors
 * @dev Registry for Connectors.
 */


interface IndexInterface {
    function master() external view returns (address);
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


contract LinkedList is Controllers {

    struct Count {
        uint64 total;
        uint64 onlyEnabled;
    }

    // Connectors Count.
    Count public count;
    // First enabled Connector Address.
    address public first;
    // Last enabled Connector Address.
    address public last;
    // Connectors List(Address of Connector => List(Previous and Next Enabled Connector)).
    mapping (address => address) public list;

    /**
     * @dev Add Connector to Connector's Linked List.
     * @param _connector Connector Address.
    */
    function addToList(address _connector) internal {
        if (last != address(0)) list[last] = _connector;
        if (first == address(0)) first = _connector;
        last = _connector;
        count.total++;
        count.onlyEnabled++;
    }

    // Connectors Count.
    Count public countStatic;
    // First enabled Connector Address.
    address public firstStatic;
    // Last enabled Connector Address.
    address public lastStatic;
    // Connectors List(Address of Connector => List(Previous and Next Enabled Connector)).
    mapping (address => address) public listStatic;

    /**
     * @dev Add Connector to Connector's Linked List.
     * @param _connector Connector Address.
    */
    function addToListStatic(address _connector) internal {
        if (lastStatic != address(0)) listStatic[lastStatic] = _connector;
        if (firstStatic == address(0)) firstStatic = _connector;
        lastStatic = _connector;
        countStatic.total++;
        countStatic.onlyEnabled++;
    }

}


contract InstaConnectors is LinkedList {

    event LogEnable(address indexed connector);
    event LogDisable(address indexed connector);
    event LogEnableStatic(address indexed connector);
    event LogDisableStatic(address indexed connector);
    event LogDisableStaticTimer(address indexed connector);

    // Static Connectors (ID => Static Connector).
    address[] public staticList;
    // Static Connector Disable Timer (Static Connector => Timer).
    mapping (address => uint) public staticTimer;

    /**
     * @dev Enable Connector.
     * @param _connector Connector Address.
    */
    function enable(address _connector) external isChief {
        require(!connectors[_connector], "already-enabled");
        connectors[_connector] = true;
        addToList(_connector);
        emit LogEnable(_connector);
    }
    /**
     * @dev Disable Connector.
     * @param _connector Connector Address.
    */
    function disable(address _connector) external isChief {
        require(connectors[_connector], "not-connector");
        delete connectors[_connector];
        count.onlyEnabled--;
        emit LogDisable(_connector);
    }

    /**
     * @dev Enable Static Connector.
     * @param _connector Static Connector Address.
    */
    function enableStatic(address _connector) external isChief {
        require(!staticConnectors[_connector], "already-enabled");
        staticList.push(_connector);
        staticConnectors[_connector] = true;
        addToListStatic(_connector);
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
                require(staticTimer[_connector] <= now, "30-days-not-over");
                countStatic.onlyEnabled--;
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