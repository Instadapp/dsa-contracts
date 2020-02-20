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
    address public constant index = 0x0000000000000000000000000000000000000000;

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
        require(chief[msg.sender] || msg.sender == IndexInterface(index).master(), "not-an-chief");
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

    event LogEnable(address indexed connector);
    event LogDisable(address indexed connector);
    event LogEnableStatic(address indexed connector);

    // Connectors Count.
    uint public count;
    // First enabled Connector Address.
    address public first;
    // Last enabled Connector Address.
    address public last;
    // Connectors List(Address of Connector => List(Previous and Next Enabled Connector)).
    mapping (address => List) public list;

    struct List {
        address prev;
        address next;
    }


    /**
     * @dev Add Connector to Connector's Linked List.
     * @param _connector Connector Address.
    */
    function addToList(address _connector) internal {
        if (last != address(0)) {
            list[_connector].prev = last;
            list[last].next = _connector;
        }
        if (first == address(0)) {
            first = _connector;
        }
        last = _connector;
        count = add(count, 1);

        emit LogEnable(_connector);
    }

    /**
     * @dev Remove Connector to Connector's Linked List.
     * @param _connector Connector Address.
    */
    function removeFromList(address _connector) internal {
        if (list[_connector].prev != address(0)) {
            list[list[_connector].prev].next = list[_connector].next;
        } else {
            first = list[_connector].next;
        }
        if (list[_connector].next != address(0)) {
            list[list[_connector].next].prev = list[_connector].prev;
        } else {
            last = list[_connector].prev;
        }
        count = sub(count, 1);

        emit LogDisable(_connector);
    }

}


contract InstaConnectors is LinkedList {
    // Static Connectors Count.
    uint public staticCount;
    // Static Connectors (ID => Static Connector).
    mapping (uint => address) public staticList;

    /**
     * @dev Enable Connector.
     * @param _connector Connector Address.
    */
    function enable(address _connector) external isChief {
        require(!connectors[_connector], "already-enabled");
        connectors[_connector] = true;
        addToList(_connector);
    }
    /**
     * @dev Disable Connector.
     * @param _connector Connector Address.
    */
    function disable(address _connector) external isChief {
        require(connectors[_connector], "not-connector");
        delete connectors[_connector];
        removeFromList(_connector);
    }

    /**
     * @dev Enable Static Connector.
     * @param _connector Static Connector Address.
    */
    function enableStatic(address _connector) external isChief {
        require(!staticConnectors[_connector], "already-enabled");
        staticCount++;
        staticList[staticCount] = _connector;
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