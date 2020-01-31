pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

interface IndexInterface {
    function connectors() external view returns (address);
    function check() external view returns (address);
}

interface ConnectorsInterface {
    function logic(address[] calldata logicAddr) external view returns (bool);
}

interface CheckInterface {
    function isOk() external view returns (bool);
}


/**
 * @title address record
 */
contract Record {

    /**
     * @dev addresses of index and auth
     */
    address public constant index = 0x0000000000000000000000000000000000000000; // TODO: you know what to do here
    mapping (address => bool) public auth;

    function setBasics(address _owner) external {
        require(msg.sender == index, "not-index");
        auth[_owner] = true;
    }

}


/**
 * @dev logging the execute events
 */
contract Note is Record { // TODO: let's remove the sig & data?? Change it to LogCast()
    event LogNote(
        bytes4 indexed sig,
        address indexed origin,
        address indexed guy,
        uint wad,
        bytes fax
    );
    modifier note(address origin) {
        emit LogNote(
            msg.sig,
            origin,
            msg.sender,
            msg.value,
            msg.data
        );
        _;
    }
}

/**
 * @title User Owned Smart Account
 */
contract SmartAccount is Note {

    receive() external payable {}

    mapping (uint => bytes32) internal mbytes; // Use it to store execute data and delete in the same transaction
    mapping (uint => uint) internal muint; // Use it to store execute data and delete in the same transaction
    mapping (uint => address) internal maddr; // Use it to store execute data and delete in the same transaction

    function cast(
        address[] calldata _targets,
        bytes[] calldata _datas,
        address _origin
    )
    external
    payable
    note(_origin)
    returns (bytes[] memory responses)
    {
        IndexInterface indexContract = IndexInterface(index);
        require(ConnectorsInterface(indexContract.connectors()).logic(_targets), "not-connector");
        require(auth[msg.sender] || msg.sender == index, "permission-denied");

        responses = new bytes[](_targets.length);
        for (uint i = 0; i < _targets.length; i++) {
            responses[i] = spell(_targets[i], _datas[i]);
        }

        address _check = indexContract.check();
        if (_check != address(0)) require(CheckInterface(_check).isOk(), "not-ok");
    }

    /**
     * @dev execute authorised calls via delegate call
     * @param _target logic proxy address
     * @param _data delegate call data
     */
    function spell(address _target, bytes memory _data) internal returns (bytes memory response) {
        require(_target != address(0), "target-invalid");
        assembly { // call contract in current context
            // TODO: WTF?? - think on replacing 'sub(gas(), 5000)' with 'gas()'
            let succeeded := delegatecall(sub(gas(), 5000), _target, add(_data, 0x20), mload(_data), 0, 32)
            response := mload(0) // load delegatecall output
            switch iszero(succeeded)
            case 1 {
                revert(0, 0) // throw if delegatecall failed
            }
        }
    }

}