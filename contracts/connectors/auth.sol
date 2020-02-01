pragma solidity ^0.6.0;


interface ListInterface {
    function addAuth(address owner, address account) external;
    function removeAuth(address owner, address account) external;
}


contract SmartAuth {

    function getListAddr() internal pure returns(address) {
        return 0x0000000000000000000000000000000000000000;//InstaList Address // TODO: you know what to do here
    }

    event LogAddAuth(address indexed auth);
    event LogRemoveAuth(address indexed auth);

    mapping (address => bool) internal auth;

    /**
     * @dev add new owner
     */
    function addModule(address _owner) public {
        require(_owner != address(0), " not-address");
        require(!auth[_owner], "already-added");
        auth[_owner] = true;
        ListInterface(getListAddr()).addAuth(_owner, address(this));
        emit LogAddAuth(_owner);
    }

    /**
     * @dev remove new owner
     */
    function removeModule(address _owner) public {
        require(_owner != address(0), "not-address");
        require(auth[_owner], "not-module");
        delete auth[_owner];
        ListInterface(getListAddr()).removeAuth(_owner, address(this));
        emit LogRemoveAuth(_owner);
    }

}