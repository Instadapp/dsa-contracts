pragma solidity ^0.6.0;

contract ConnectEmitEvent {

    event LogEmitEvent(address indexed addresss);

    function emitEvent() public payable {
        emit LogEmitEvent(address(this));
    }
}