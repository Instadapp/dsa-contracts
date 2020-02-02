pragma solidity ^0.6.0;


interface ListInterface {
    function addAuth(address owner) external;
    function removeAuth(address owner) external;
}


contract ConnectAuth {

    string public name = "Auth-V1";

    function getListAddr() internal pure returns(address) {
        return 0x0000000000000000000000000000000000000000;//InstaList Address
    }

    event LogAddAuth(address indexed auth);
    event LogRemoveAuth(address indexed auth);

    mapping (address => bool) internal auth;

    /**
     * @dev add new owner
     */
    function addModule(address _owner) public {
        require(_owner != address(0), "not-address");
        require(!auth[_owner], "already-added");
        auth[_owner] = true;
        ListInterface(getListAddr()).addAuth(_owner);
        emit LogAddAuth(_owner);
    }

    /**
     * @dev remove new owner
     */
    function removeModule(address _owner) public {
        require(_owner != address(0), "not-address");
        require(auth[_owner], "not-module");
        delete auth[_owner];
        ListInterface(getListAddr()).removeAuth(_owner);
        emit LogRemoveAuth(_owner);
    }

}