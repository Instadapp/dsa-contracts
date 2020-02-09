pragma solidity ^0.6.0;


interface IndexInterface {
    function master() external view returns (address);
}


contract Controllers {

    event LogAddController(address addr);
    event LogRemoveController(address addr);

    address public constant index = 0x0000000000000000000000000000000000000000; // TODO: Index Contract Address

    mapping(address => bool) public chief;
    mapping(address => bool) public connectors;
    mapping(address => bool) public staticConnectors;

    modifier isChief {
        require(chief[msg.sender] || msg.sender == IndexInterface(index).master(), "not-an-chief");
        _;
    }

    function enableChief(address _userAddress) external isChief {
        chief[_userAddress] = true;
        emit LogAddController(_userAddress);
    }

    function disableChief(address _userAddress) external isChief {
        chief[_userAddress] = false;
        emit LogRemoveController(_userAddress);
    }

}


contract LinkedList is Controllers {

    event LogEnable(address indexed connector);
    event LogDisable(address indexed connector);
    event LogEnableStatic(address indexed connector);

    uint public count;
    address public first;
    address public last;
    mapping (address => List) public list; // SLA address => user address => List

    struct List {
        address prev;
        address next;
    }

    function addToList(address _connector) internal {
        if (last != address(0)) {
            list[_connector].prev = last;
            list[last].next = _connector;
        }
        if (first == address(0)) {
            first = _connector;
        }
        last = _connector;
        count = count++;

        emit LogEnable(_connector);
    }

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
        count = count--; // TODO: - use sub()

        emit LogDisable(_connector);
    }

}


contract InstaConnectors is LinkedList {

    uint public staticCount;
    mapping (uint => address) public staticList; // SLA address => user address => List

    /// @dev Enable logic proxy address
    function enable(address _connector) external isChief {
        require(!connectors[_connector], "already-enabled");
        connectors[_connector] = true;
        addToList(_connector);
    }

    /// @dev Disable logic proxy address
    function disable(address _connector) external isChief {
        require(connectors[_connector], "not-connector");
        connectors[_connector] = false;
        removeFromList(_connector);
    }

    /// @dev Enable logic proxy address
    function enableStatic(address _connector) external isChief {
        require(!staticConnectors[_connector], "already-enabled");
        staticCount++;
        staticList[staticCount] = _connector;
        staticConnectors[_connector] = true;
    }

    function isConnector(address[] calldata _connectors) external view returns (bool isOk) {
        isOk = true;
        for (uint i = 0; i < _connectors.length; i++) {
            if (!connectors[_connectors[i]]) {
                isOk = false;
                break;
            }
        }
    }

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