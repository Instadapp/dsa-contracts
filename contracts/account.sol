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
    function addAuth(address chief) external;
    function removeAuth(address chief) external;
}


contract Record {

    event LogEnable(address indexed chief);
    event LogDisable(address indexed chief);

    address public constant index = 0x0000000000000000000000000000000000000000; // TODO: index contract address
    mapping (address => bool) private auth;

    function isAuth(address chief) public view returns (bool) {
        return auth[chief];
    }

    function enable(address chief) public {
        require(msg.sender == address(this) || msg.sender == index, "not-self-index");
        require(chief != address(0), "not-valid");
        require(!auth[chief], "already-enabled");
        auth[chief] = true;
        ListInterface(IndexInterface(index).list()).addAuth(chief);
        emit LogEnable(chief);
    }

    function disable(address chief) public {
        require(msg.sender == address(this), "not-self");
        require(chief != address(0), "not-valid");
        require(auth[chief], "already-disabled");
        auth[chief] = false;
        ListInterface(IndexInterface(index).list()).removeAuth(chief);
        emit LogDisable(chief);
    }

}

contract InstaAccount is Record {

    event LogCast(address indexed origin, address indexed sender, uint value);
    event LogDeposit(address indexed _sender, uint _amt);

    receive() external payable {
        emit LogDeposit(msg.sender, msg.value);
    }

    function spell(address _target, bytes memory _data) internal returns (bytes32 response) {
        require(_target != address(0), "target-invalid");
        assembly {
            // TODO: WTF?? - think on replacing 'sub(gas(), 5000)' with 'gas()'
            let succeeded := delegatecall(sub(gas(), 5000), _target, add(_data, 0x20), mload(_data), 0, 32)
            response := mload(0)
            switch iszero(succeeded)
            case 1 {
                revert(0, 0)
            }
        }
    }

    function cast(
        address[] calldata _targets,
        bytes[] calldata _datas,
        address _origin
    )
    external
    payable
    returns (bytes32[] memory responses) // TODO: does return has any use case?
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

}