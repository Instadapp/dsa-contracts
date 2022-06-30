pragma solidity ^0.7.0;

contract ConnectV2EmitEvent {

    event LogEmitEvent(address indexed dsaAddress, address indexed _sender);

    function emitEvent() public payable returns (string memory _eventName, bytes memory _eventParam) {
        emit LogEmitEvent(address(this), msg.sender);

        _eventName = "LogEmitEvent(address,address)";
        _eventParam = abi.encode(address(this), msg.sender);
    }

    string constant public name = "EmitEvent-v1";
}