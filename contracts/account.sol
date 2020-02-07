pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

interface IndexInterface {
    function connectors() external view returns (address);
    function check() external view returns (address);
    function list() external view returns (address);
}

interface ConnectorsInterface {
    function isConnector(address[] calldata logicAddr) external view returns (bool);
}

interface CheckInterface {
    function isOk() external view returns (bool);
}

interface ListInterface {
    function addAuth(address _owner) external;
    function removeAuth(address _owner) external;
}


/**
 * @title address record
 */
contract Record {

    event LogEnable(address indexed auth);
    event LogDisable(address indexed auth);

    /**
     * @dev addresses of index and auth
     */
    address public constant index = 0x0000000000000000000000000000000000000000; // TODO: you know what to do here
    mapping (address => bool) private auth;

    function isAuth(address _user) public view returns (bool) {
        return auth[_user];
    }

    function setBasics(address _owner) external {
        require(msg.sender == index, "not-index");
        auth[_owner] = true;
    }

    function enable(address _newAuth) public {
        require(msg.sender == address(this), "Not-this-account");
        require(_newAuth != address(0), "Not-valid");
        require(!auth[_newAuth], "Already-authenticated");
        auth[_newAuth] = true;
        ListInterface(IndexInterface(index).list()).addAuth(_newAuth);
        emit LogEnable(_newAuth);
    }

    function disable(address _auth) public {
        require(msg.sender == address(this), "Not-this-account");
        require(_auth != address(0), "Not-valid");
        require(auth[_auth], "not-authenticated");
        auth[_auth] = false;
        ListInterface(IndexInterface(index).list()).removeAuth(_auth);
        emit LogDisable(_auth);
    }

}


/**
 * @title User Owned Smart Account
 */
contract InstaAccount is Record {

    event LogCast(address indexed origin, address indexed sender, uint value);
    event LogEthDeposit(address indexed _sender, uint _amt);

    receive() external payable {
        emit LogEthDeposit(msg.sender, msg.value);
    }

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
    returns (bytes32[] memory responses) // TODO: Does return has any use case
    {
        IndexInterface indexContract = IndexInterface(index);
        require(ConnectorsInterface(indexContract.connectors()).isConnector(_targets), "not-connector");
        require(isAuth(msg.sender) || msg.sender == index, "permission-denied");

        responses = new bytes32[](_targets.length);
        for (uint i = 0; i < _targets.length; i++) {
            responses[i] = spell(_targets[i], _datas[i]);
        }

        address _check = indexContract.check();
        if (_check != address(0)) require(CheckInterface(_check).isOk(), "not-ok");

        emit LogCast(_origin, msg.sender, msg.value);
    }

    /**
     * @dev execute authorised calls via delegate call
     * @param _target logic proxy address
     * @param _data delegate call data
     */
    function spell(address _target, bytes memory _data) internal returns (bytes32 response) {
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