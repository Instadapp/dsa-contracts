pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;


interface ConnectorsInterface {
    function logic(address[] calldata logicAddr) external view returns (bool);
}

interface CheckInterface {
    function isOk() external view returns (bool);
}

interface RegistryInterface {
    function connectors() external view returns (address);
    function check() external view returns (address);
}


/**
 * @title Address Registry Record
 */
contract AddressRecord {

    /**
     * @dev address registry of system, logic and wallet addresses
     */
    address public constant registry = 0xa7615CD307F323172331865181DC8b80a2834324; // Check9898 - Random address for now
    mapping (address => bool) public authModules;

    function setBasics(address _owner) external {
        require(msg.sender == registry, "Not-registry");
        authModules[_owner] = true;
    }

}


/**
 * @dev logging the execute events
 */
contract UserNote is AddressRecord {
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
 * @title User Owned Contract Wallet
 */
contract Module is UserNote {

    receive() external payable {}

    mapping (uint => bytes32) internal memoryBytes; // Use it to store execute data and delete in the same transaction
    mapping (uint => uint) internal memoryUint; // Use it to store execute data and delete in the same transaction
    mapping (uint => address) internal memoryAddr; // Use it to store execute data and delete in the same transaction

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
        RegistryInterface registryContract = RegistryInterface(registry);
        require(ConnectorsInterface(registryContract.connectors()).logic(_targets), "Not-connector");
        require(authModules[msg.sender] || msg.sender == registry, "permission-denied");

        responses = new bytes[](_targets.length);
        for (uint i = 0; i < _targets.length; i++) {
            responses[i] = spell(_targets[i], _datas[i]);
        }

        address _check = registryContract.check();
        if (_check != address(0)) require(CheckInterface(_check).isOk(), "Check-not-ok");
    }

    /**
     * @dev Execute authorised calls via delegate call
     * @param _target logic proxy address
     * @param _data delegate call data
     */
    function spell(address _target, bytes memory _data) internal returns (bytes memory response) {

        require(_target != address(0), "target-invalid");

        // call contract in current context
        assembly {
            // Check9898 - think on replacing 'sub(gas(), 5000)' with 'gas()'
            let succeeded := delegatecall(sub(gas(), 5000), _target, add(_data, 0x20), mload(_data), 0, 32)
            response := mload(0)      // load delegatecall output
            switch iszero(succeeded)
            case 1 {
                // throw if delegatecall failed
                revert(0, 0)
            }
        }

    }

}