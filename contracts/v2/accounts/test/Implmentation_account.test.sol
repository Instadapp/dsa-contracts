pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

/**
 * Test ImplementationM0
 * Defi Smart Account
 * Not a complete or correct contract.
 */
interface IndexInterface {
    function list() external view returns (address);
}

interface ListInterface {
    function addAuth(address user) external;
}

contract CommonSetup {
    // Auth Module(Address of Auth => bool).
    mapping(address => bool) internal auth;
}

contract Record is CommonSetup {
    address public immutable instaIndex;

    constructor(address _instaIndex) {
        instaIndex = _instaIndex;
    }

    event LogEnableUser(address indexed user);
    event LogPayEther(uint256 amt);

    /**
     * @dev Test function to check transfer of ether, should not be used.
     * @param _account account module address.
     */
    function handlePayment(address payable _account) public payable {
        _account.transfer(msg.value);
        emit LogPayEther(msg.value);
    }
}

contract InstaImplementationM0Test is Record {
    constructor(address _instaIndex) Record(_instaIndex) {}
}
