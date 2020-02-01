pragma solidity ^0.6.0;


interface ListInterface {
    function addAuth(address _owner, address _SLA) external;
    function removeAuth(address _owner, address _SLA) external;
}


contract SmartAuth {

    function getListAddr() internal pure returns(address) {
        return 0x0000000000000000000000000000000000000000;//InstaList Address // TODO: you know what to do here
    }

    event LogAddModule(address indexed authModule);
    event LogRemoveModule(address indexed authModule);

    mapping (address => bool) private authModule;

    /**
     * @dev add new owner
     */
    function addModule(address _owner) public {
        require(_owner != address(0), "address-0");
        require(!authModule[_owner], "already-added");
        authModule[_owner] = true;
        ListInterface(getListAddr()).addAuth(_owner, address(this));
        emit LogAddModule(_owner);
    }

    /**
     * @dev remove new owner
     */
    function removeModule(address _owner) public {
        require(_owner != address(0), "address-0");
        require(authModule[_owner], "not-a-module");
        delete authModule[_owner];
        ListInterface(getListAddr()).removeAuth(_owner, address(this));
        emit LogRemoveModule(_owner);
    }

}