pragma solidity ^0.6.0;

/**
 * @title ConnectAuth.
 * @dev Connector For Adding Auth.
 */

interface AccountInterface {
    function enable(address user) external;
    function disable(address user) external;
}

interface EventInterface {
    function emitEvent(uint _connectorType, uint _connectorID, bytes4 _eventCode, bytes calldata _eventData) external;
}


contract Basics {

    /**
     * @dev Return InstaEvent Address.
     */
    function getEventAddr() public pure returns (address) {
        return 0x0000000000000000000000000000000000000000;
    }

    function connectorID() public pure returns(uint _type, uint _id) {
        (_type, _id) = (1, 1);
    }

}


contract Auth is Basics {

    event LogAddAuth(address _msgSender, address _auth);
    event LogRemoveAuth(address _msgSender, address _auth);

    /**
     * @dev Add New Owner
     * @param user User Address.
     */
    function addModule(address user) public payable {
        AccountInterface(address(this)).enable(user);

        emit LogAddAuth(msg.sender, user);

        bytes4 _eventCode = bytes4(keccak256("LogAddAuth(address, address)"));
        bytes memory _eventParam = abi.encode(msg.sender, user);
        (uint _type, uint _id) = connectorID();
        EventInterface(getEventAddr()).emitEvent(_type, _id, _eventCode, _eventParam);
    }

    /**
     * @dev Remove New Owner
     * @param user User Address.
     */
    function removeModule(address user) public payable {
        AccountInterface(address(this)).disable(user);

        emit LogRemoveAuth(msg.sender, user);

        bytes4 _eventCode = bytes4(keccak256("LogRemoveAuth(address, address)"));
        bytes memory _eventParam = abi.encode(msg.sender, user);
        (uint _type, uint _id) = connectorID();
        EventInterface(getEventAddr()).emitEvent(_type, _id, _eventCode, _eventParam);
    }

}


contract ConnectAuth is Auth {
    string public name = "Auth-v1";
}