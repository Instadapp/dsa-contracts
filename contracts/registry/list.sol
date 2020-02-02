pragma solidity ^0.6.0;


contract DSMath {

    function add(uint64 x, uint64 y) internal pure returns (uint64 z) {
        require((z = x + y) >= x, "ds-math-add-overflow");
    }

    function sub(uint64 x, uint64 y) internal pure returns (uint64 z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }

}


contract Variables is DSMath {

    address public constant index = 0x0000000000000000000000000000000000000000; // TODO: you know what to do here

    // account mapping
    uint64 public accounts;
    mapping (address => uint64) public accountID; // get account ID from address
    mapping (uint64 => address) public accountAddr; // get account address from ID

    // linked list of users
    mapping (address => UserLink) public userLink; // user address => user linked list connection
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

    // linked list of accounts
    mapping (uint64 => AccountLink) public accountLink; // SLA ID => SLA linked list connection
    mapping (uint64 => mapping (address => AccountList)) public accountList; // SLA address => user address => List
    struct AccountLink {
        address first;
        address last;
        uint64 count;
    }
    struct AccountList {
        address prev;
        address next;
    }

}

contract Configure is Variables {

    function addAccount(address _owner, uint64 _account) internal { // TODO: gotta test it out throughly
        if (userLink[_owner].last != 0) {
            userList[_owner][_account].prev = userLink[_owner].last;
            userList[_owner][userLink[_owner].last].next = _account;
        }
        if (userLink[_owner].first == 0) userLink[_owner].first = _account;
        userLink[_owner].last = _account;
        userLink[_owner].count = add(userLink[_owner].count, 1);
    }

    function removeAccount(address _owner, uint64 _account) internal { // TODO: - gotta test it out throughly
        uint64 _prev = userList[_owner][_account].prev;
        uint64 _next = userList[_owner][_account].next;
        if (_prev != 0) userList[_owner][_prev].next = _next;
        if (_next != 0) userList[_owner][_next].prev = _prev;
        if (_prev == 0) userLink[_owner].first = _next;
        if (_next == 0) userLink[_owner].last = _prev;
        userLink[_owner].count = sub(userLink[_owner].count, 1);
        delete userList[_owner][_account];
    }

    function addUser(address _owner, uint64 _account) internal { // TODO: - Gotta test it out throughly
        if (accountLink[_account].last != address(0)) {
            accountList[_account][_owner].prev = accountLink[_account].last;
            accountList[_account][accountLink[_account].last].next = _owner;
        }
        if (accountLink[_account].first == address(0)) accountLink[_account].first = _owner;
        accountLink[_account].last = _owner;
        accountLink[_account].count = add(accountLink[_account].count, 1);
    }

    function removeUser(address _owner, uint64 _account) internal { // TODO: - Gotta test it out throughly
        address _prev = accountList[_account][_owner].prev;
        address _next = accountList[_account][_owner].next;
        if (_prev != address(0)) accountList[_account][_prev].next = _next;
        if (_next != address(0)) accountList[_account][_next].prev = _prev;
        if (_prev == address(0)) accountLink[_account].first = _next;
        if (_next == address(0)) accountLink[_account].last = _prev;
        accountLink[_account].count = sub(accountLink[_account].count, 1);
        delete accountList[_account][_owner];
    }

}

contract InstaList is Configure {

    function addAuth(address _owner) external {
        require(accountID[msg.sender] != 0, "not-account");
        addAccount(_owner, accountID[msg.sender]);
        addUser(_owner, accountID[msg.sender]);
    }

    function removeAuth(address _owner) external {
        require(accountID[msg.sender] != 0, "not-account");
        removeAccount(_owner, accountID[msg.sender]);
        removeUser(_owner, accountID[msg.sender]);
    }

    function init(address _owner, address _account) external {
        require(msg.sender == index, "not-index");
        accounts++;
        accountID[_account] = accounts;
        accountAddr[accounts] = _account;
        addAccount(_owner, accounts);
        addUser(_owner, accounts);
    }

}