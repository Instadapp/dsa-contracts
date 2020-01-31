pragma solidity ^0.6.0;


interface IndexInterface {
    function master() external view returns (address);
}


contract Controllers {

    event LogAddController(address addr);
    event LogRemoveController(address addr);

    /// @notice Map of logic proxy state

    address private constant index = 0xa7615CD307F323172331865181DC8b80a2834324; // Check9898 - Random address for now

    mapping(address => bool) public chief;
    mapping(address => bool) public connectors;

    modifier isChief {
        require(chief[msg.sender] || msg.sender == IndexInterface(index).master(), "Not-an-admin");
        _;
    }

    function enableChief(address _userAddress) external isAdminMod {
        chief[_userAddress] = true;
        emit LogAddController(_userAddress);
    }

    function disableChief(address _userAddress) external isAdminMod {
        chief[_userAddress] = false;
        emit LogRemoveController(_userAddress);
    }

}


contract ConnectorsList is Controllers {

    event LogEnableConnector(address indexed _connector);
    event LogDisableConnector(address indexed _connector);

    uint public count;
    address public first;
    address public last;
    mapping (address => List) public list; // SLA address => user address => List

    struct List {
        address prev;
        address next;
    }

    function addToList(address _connector) internal {
        connectors[_connector] = true;
        if (first == address(0)) {
            first = _connector;
        }
        if (last != address(0)) {
            list[_connector].prev = last;
            list[last].next = _connector;
        }
        last = _connector;
        count = count++;

        emit LogEnableConnector(_connector);
    }

    function removeFromList(address _connector) internal {
        connectors[_connector] = false;
        if (list[_connector].prev != address(0)) {
            list[list[_connector].prev].next = list[_connector].next;
        } else {
            first = list[_connector].next;
        }
        if (list[_connector].next != address(0)) {
            list[list[_connector].next].prev = list[_connector].prev;
        } else {
            first = list[_connector].prev;
        }
        count = count--; // Check9898 - use sub()

        emit LogDisableConnector(_connector);
    }

}


contract Connectors is ConnectorsList {

    /// @dev Enable logic proxy address
    /// @param _logicAddress (address)
    function enableConnector(address _connector, bool _reset) external isAdminMod {
        require(!connectors[_connector], "Already-enabled");
        addToList(_connector);
    }

    /// @dev Disable logic proxy address
    /// @param _logicAddress (address)
    function disableConnector(address _connector, bool _reset) external isAdminMod {
        require(connectors[_connector], "not-a-connector");
        removeFromList(_connector);
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

}