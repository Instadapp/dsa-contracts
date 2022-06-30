pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

/**
 * @title ConnectAuth.
 * @dev Connector For Adding Authorities.
 */

interface AccountInterface {
    function enable(address) external;
    function disable(address) external;
}

interface ListInterface {
    struct UserLink {
        uint64 first;
        uint64 last;
        uint64 count;
    }

    struct UserList {
        uint64 prev;
        uint64 next;
    }

    struct AccountLink {
        address first;
        address last;
        uint64 count;
    }

    struct AccountList {
        address prev;
        address next;
    }

    function accounts() external view returns (uint);
    function accountID(address) external view returns (uint64);
    function accountAddr(uint64) external view returns (address);
    function userLink(address) external view returns (UserLink memory);
    function userList(address, uint64) external view returns (UserList memory);
    function accountLink(uint64) external view returns (AccountLink memory);
    function accountList(uint64, address) external view returns (AccountList memory);
}


contract Basics {
    /**
     * @dev Return Address.
    */
    address public immutable instaList;

    constructor(address _instaList) {
        instaList = _instaList;
    }

}

contract Helpers is Basics {
    constructor(address _instaList) Basics(_instaList) {}

    function checkAuthCount() internal view returns (uint count) {
        ListInterface listContract = ListInterface(instaList);
        uint64 accountId = listContract.accountID(address(this));
        count = listContract.accountLink(accountId).count;
    }
}

contract Auth is Helpers {
    constructor(address _instaList) Helpers(_instaList) {}

    event LogAddAuth(address indexed _msgSender, address indexed _authority);
    event LogRemoveAuth(address indexed _msgSender, address indexed _authority);

    /**
     * @dev Add New authority
     * @param authority authority Address.
     */
    function add(address authority) external payable returns (string memory _eventName, bytes memory _eventParam) {
        AccountInterface(address(this)).enable(authority);

        emit LogAddAuth(msg.sender, authority);

        // _eventCode = keccak256("LogAddAuth(address,address)");
        _eventName = "LogAddAuth(address,address)";
        _eventParam = abi.encode(msg.sender, authority);
    }

    /**
     * @dev Remove authority
     * @param authority authority Address.
     */
    function remove(address authority) external payable returns (string memory _eventName, bytes memory _eventParam)  {
        require(checkAuthCount() > 1, "Removing-all-authorities");
        AccountInterface(address(this)).disable(authority);

        emit LogRemoveAuth(msg.sender, authority);

        // _eventCode = keccak256("LogRemoveAuth(address,address)");
        _eventName = "LogRemoveAuth(address,address)";
        _eventParam = abi.encode(msg.sender, authority);
    }

}


contract ConnectV2Auth is Auth {
    constructor(address _instaList) Auth(_instaList) {}
    string public constant name = "Auth-v1";
}