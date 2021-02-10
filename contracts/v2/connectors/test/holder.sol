pragma solidity ^0.7.0;
import "hardhat/console.sol";

contract EthHolder {

    function ping() public {
        console.log("You are %s", msg.sender);
        payable(msg.sender).transfer(0.1 ether);
    }

    receive() external payable {}

}
