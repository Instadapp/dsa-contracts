pragma solidity ^0.7.0;

pragma experimental ABIEncoderV2;

/**
 * Test ImplementationM0 
 * Defi Smart Account
 * Not a complete or correct contract.
 */
interface AccountInterface {
    function receiveEther() external payable;
}

interface IndexInterface {
    function list() external view returns (address);
}

interface ListInterface {
    function addAuth(address user) external;
}

contract CommonSetup {
    // Auth Module(Address of Auth => bool).
    mapping (address => bool) internal auth;
}

contract Record is CommonSetup {

    address public immutable instaIndex;

    constructor (address _instaIndex) {
        instaIndex = _instaIndex;
    }

    event LogEnableUser(address indexed user);

    /**
     * @dev Check for Auth if enabled.
     * @param user address/user/owner.
     */
    function isAuth(address user) public view returns (bool) {
        return auth[user];
    }

    /**
     * @dev Enable New User.
     * @param user Owner of the Smart Account.
    */
    function enable(address user) public {
        require(msg.sender == address(this) || msg.sender == instaIndex || isAuth(msg.sender), "not-self-index");
        require(user != address(0), "not-valid");
        require(!auth[user], "already-enabled");
        auth[user] = true;
        ListInterface(IndexInterface(instaIndex).list()).addAuth(user);
        emit LogEnableUser(user);
    }

    /**
     * @dev Test function to check transfer of ether, should not be used.
     * @param _account account module address.
    */
    function handlePayment(address _account) public payable {
        AccountInterface(_account).receiveEther{value: msg.value}();
    }
}

contract InstaImplementationM0Test is Record {
    constructor (address _instaIndex) Record(_instaIndex) {}
}