pragma solidity ^0.6.0;

interface IndexInterface {
    function SLAID(address _module) external view returns(uint id);
}


contract DSMath {

    function add(uint64 x, uint64 y) internal pure returns (uint64 z) {
        require((z = x + y) >= x, "ds-math-add-overflow");
    }

    function sub(uint64 x, uint64 y) internal pure returns (uint64 z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }

}


contract VarDef is DSMath {

    address public constant index = 0xa7615CD307F323172331865181DC8b80a2834324; // Check9898 - random address for now

    // SLA Details
    /// @notice Address to UserWallet proxy map
    uint64 public SLACount;
    mapping (address => uint64) public SLAID;
    mapping (uint64 => address) public SLAModule;
    mapping (address => address) public FirstOwner; // First owner of the smart layer account

    // Linked list of User
    mapping (address => UserLink) public userLink; // user's address => User Linked list connection
    mapping (address => mapping(uint64 => UserList)) public userList; // user address => SLA ID => List (previous and next SLA)
    struct UserLink {
        uint64 first;
        uint64 last;
        uint64 count;
    }

    struct UserList {
        uint64 prev;
        uint64 next;
    }

    // Linked list of SLA
    mapping (uint64 => SLALink) public slaLink; // SLA ID => SLA linked list connection
    mapping (uint64 => mapping (address => SLAList)) public slalist; // SLA address => user address => List
    struct SLALink {
        address first;
        address last;
        uint64 count;
    }

    struct SLAList {
        address prev;
        address next;
    }

}

contract ListUpdate is VarDef {

    function _addSLA(address _owner, uint64 _SLA) internal { // Check9898 - Gotta test it out throughly
        if (userLink[_owner].last != 0) {
            userList[_owner][_SLA].prev = userLink[_owner].last;
            userList[_owner][userLink[_owner].last].next = _SLA;
        }
        if (userLink[_owner].first == 0) {
            userLink[_owner].first = _SLA;
        }
        userLink[_owner].last = _SLA;
        userLink[_owner].count = add(userLink[_owner].count, 1);
    }

    function _removeSLA(address _owner, uint64 _SLA) internal { // Check9898 - Gotta test it out throughly
        uint64 _prev = userList[_owner][_SLA].prev;
        uint64 _next = userList[_owner][_SLA].next;
        if (_prev != 0) {
            userList[_owner][_prev].next = _next;
        }
        if (_next != 0) {
            userList[_owner][_next].prev = _prev;
        }
        // No if else, adding this in the end with more ifs to reduce gas as they'll stored together
        if (_prev == 0) {
            userLink[_owner].first = _next;
        }
        if (_next == 0) {
            userLink[_owner].last = _prev;
        }
        userLink[_owner].count = sub(userLink[_owner].count, 1);
        delete userList[_owner][_SLA];
    }

    function _addUser(address _owner, uint64 _SLA) internal { // Check9898 - Gotta test it out throughly
        if (slaLink[_SLA].last != address(0)) {
            slalist[_SLA][_owner].prev = slaLink[_SLA].last;
            slalist[_SLA][slaLink[_SLA].last].next = _owner;
        }
        if (slaLink[_SLA].first == address(0)) {
            slaLink[_SLA].first = _owner;
        }
        slaLink[_SLA].last = _owner;
        slaLink[_SLA].count = add(slaLink[_SLA].count, 1);
    }

    function _removeUser(address _owner, uint64 _SLA) internal { // Check9898 - Gotta test it out throughly
        address _prev = slalist[_SLA][_owner].prev;
        address _next = slalist[_SLA][_owner].next;
        if (_prev != address(0)) {
            slalist[_SLA][_prev].next = _next;
        }
        if (_next != address(0)) {
            slalist[_SLA][_next].prev = _prev;
        }
        // No if else, adding this in the end with more ifs to reduce gas as they'll stored together
        if (_prev == address(0)) {
            slaLink[_SLA].first = _next;
        }
        if (_next == address(0)) {
            slaLink[_SLA].last = _prev;
        }
        slaLink[_SLA].count = sub(slaLink[_SLA].count, 1);
        delete slalist[_SLA][_owner];
    }

}

contract List is ListUpdate {

    function addAuthModReg(address _owner, address _SLA) external {
        require(msg.sender == index, "Not-index");
        SLACount++;
        SLAID[_SLA] = SLACount;
        SLAModule[SLACount] = _SLA;
        FirstOwner[_SLA] = _owner;
        _addSLA(_owner, SLACount);
        _addUser(_owner, SLACount);
    }

    function addAuthMod(address _owner) external {
        require(SLAID[msg.sender] != 0, "not-SLA");
        _addSLA(_owner, SLAID[msg.sender]);
        _addUser(_owner, SLAID[msg.sender]);
    }

    function removeAuthMod(address _owner) external {
        require(SLAID[msg.sender] != 0, "not-SLA");
        _removeSLA(_owner, SLAID[msg.sender]);
        _removeUser(_owner, SLAID[msg.sender]);
    }

}