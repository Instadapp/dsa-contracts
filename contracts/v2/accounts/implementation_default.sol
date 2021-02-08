pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;
import "hardhat/console.sol";

interface IndexInterface {
    function list() external view returns (address);
}

interface CheckInterface {
    function isOk() external view returns (bool);
}

interface ListInterface {
    function addAuth(address user) external;
    function removeAuth(address user) external;
}

contract Variables {
    uint public constant implementationVersion = 1;
    // InstaIndex Address.
    address public constant instaIndex = 0x2971AdFa57b20E5a416aE5a708A8655A9c74f723;
    // The Account Module Version.
    uint public constant version = 2;
    // Auth Module(Address of Auth => bool).
    mapping (address => bool) internal _auth;
}

contract Record is Variables {

    event LogEnableUser(address indexed user);
    event LogDisableUser(address indexed user);
    event LogSwitchShield(bool _shield);

    /**
     * @dev Check for Auth if enabled.
     * @param user address/user/owner.
     */
    function isAuth(address user) public view returns (bool) {
        return _auth[user];
    }

    /**
     * @dev Enable New User.
     * @param user Owner of the Smart Account.
    */
    function enable(address user) public {
        require(msg.sender == address(this) || msg.sender == instaIndex, "not-self-index");
        require(user != address(0), "not-valid");
        require(!_auth[user], "already-enabled");
        _auth[user] = true;
        ListInterface(IndexInterface(instaIndex).list()).addAuth(user);
        emit LogEnableUser(user);
    }

    /**
     * @dev Disable User.
     * @param user Owner of the Smart Account.
    */
    function disable(address user) public {
        require(msg.sender == address(this), "not-self");
        require(user != address(0), "not-valid");
        require(_auth[user], "already-disabled");
        delete _auth[user];
        ListInterface(IndexInterface(instaIndex).list()).removeAuth(user);
        emit LogDisableUser(user);
    }

}

contract InstaAccountV2DefaultImplementation is Record {

    receive() external payable {}
}