pragma solidity ^0.6.0;


contract MemoryVar {

    mapping (address => mapping (uint => bytes32)) internal mbytes; // Use it to store execute data and delete in the same transaction
    mapping (address => mapping (uint => uint)) internal muint; // Use it to store execute data and delete in the same transaction
    mapping (address => mapping (uint => address)) internal maddr; // Use it to store execute data and delete in the same transaction

    function setBytes(uint _id, bytes32 _byte) public {
        mbytes[msg.sender][_id] = _byte;
    }

    function setUint(uint _id, uint _num) public {
        muint[msg.sender][_id] = _num;
    }

    function setAddr(uint _id, address _addr) public {
        maddr[msg.sender][_id] = _addr;
    }

    function getBytes(uint _id) public returns (bytes32 _byte) {
        _byte = mbytes[msg.sender][_id];
        delete mbytes[msg.sender][_id];
    }

    function getUint(uint _id) public returns (uint _num) {
        _num = muint[msg.sender][_id];
        delete muint[msg.sender][_id];
    }

    function getAddr(uint _id) public returns (address _addr) {
        _addr = maddr[msg.sender][_id];
        delete maddr[msg.sender][_id];
    }

}