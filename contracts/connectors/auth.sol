pragma solidity ^0.6.0;

interface AccountInterface {
    function enable(address _user) external;
    function disable(address _user) external;
}


contract Auth {

    /**
     * @dev add new owner
     */
    function addModule(address _owner) public payable {
        AccountInterface(address(this)).enable(_owner);
    }

    /**
     * @dev remove new owner
     */
    function removeModule(address _owner) public payable {
        AccountInterface(address(this)).disable(_owner);
    }

}


contract ConnectAuth is Auth {
    string public name = "Auth-V1";
}