pragma solidity ^0.6.0;


interface ListInterface {
    function addAuthMod(address _owner, address _SLA) external;
    function removeAuthMod(address _owner, address _SLA) external;
}


contract SmartAuth {

    function getListAddr() internal pure returns(address) {
        return 0xa7615CD307F323172331865181DC8b80a2834324; // Check9898 - random address for now
    }

    event LogAddModule(address indexed authModule);
    event LogRemoveModule(address indexed authModule);

    mapping (address => bool) private authModule;

    /**
     * @dev sets new owner
     */
    function addModule(address _owner) public {
        require(_owner != address(0), "address-0");
        require(!authModule[_owner], "already-added");
        authModule[_owner] = true;
        ListInterface(getListAddr()).addAuthMod(_owner, address(this));
        emit LogAddModule(_owner);
    }

    /**
     * @dev sets new owner
     */
    function removeModule(address _owner) public {
        require(_owner != address(0), "address-0");
        require(authModule[_owner], "not-a-module");
        delete authModule[_owner];
        ListInterface(getListAddr()).removeAuthMod(_owner, address(this));
        emit LogRemoveModule(_owner);
    }

}