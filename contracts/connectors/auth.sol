pragma solidity ^0.6.0;

interface AccountInterface {
    function enable(address user) external;
    function disable(address user) external;
}


contract Auth {

    /**
     * @dev add new owner
     */
    function addModule(address user) public payable {
        AccountInterface(address(this)).enable(user);
    }

    /**
     * @dev remove new owner
     */
    function removeModule(address user) public payable {
        AccountInterface(address(this)).disable(user);
    }

}


contract ConnectAuth is Auth {
    string public name = "Auth-v1";
}