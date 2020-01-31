pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

interface SLAInterface {
    function setBasics(address _owner) external;
    function cast(address[] calldata _targets, bytes[] calldata _datas, address _origin) external payable returns (bytes32[] memory responses);
}

interface listInterface {
    function addAuthModReg(address _owner, address _SLA) external;
}


contract AddressIndex {

    event LogNewMaster(address newMaster);
    event LogNewCheck(address newMaster);

    address public master;
    address public check;
    address public connectors;
    address public list;
    address public account;

    modifier isMaster() {
        require(msg.sender == master, "not-old-master");
        _;
    }

    function changeMaster(address _newMaster, bool _reset) public isMaster {
        require(_newMaster != master, "already-a-master");
        require(_newMaster != address(0), "not-valid-address");
        master = _newMaster;
        emit LogNewMaster(_newMaster);
    }

    function changeCheck(address _newCheck, bool _reset) external isMaster {
        require(_newCheck != check, "already-a-check");
        require(_newCheck != address(0), "not-valid-address");
        check = _newCheck;
        emit LogNewCheck(_newMaster);
    }

}

contract CloneFactory is AddressIndex {

    function createClone() internal returns (address result) {
        bytes20 targetBytes = bytes20(account); // Check9898 - keep address already in byte20
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
            mstore(add(clone, 0x14), targetBytes)
            mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
            result := create(0, clone, 0x37)
        }
    }

    function isClone(address query) internal view returns (bool result) {
        bytes20 targetBytes = bytes20(account);
        assembly {
            let clone := mload(0x40)
            mstore(clone, 0x363d3d373d3d3d363d7300000000000000000000000000000000000000000000)
            mstore(add(clone, 0xa), targetBytes)
            mstore(add(clone, 0x1e), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)

            let other := add(clone, 0x40)
            extcodecopy(query, other, 0, 0x2d)
            result := and(
                eq(mload(clone), mload(other)),
                eq(mload(add(clone, 0xd)), mload(add(other, 0xd)))
            )
        }
    }
}

contract WalletIndex is CloneFactory {

    event SLACreated(address indexed sender, address indexed owner, address SLA, address _origin);

    /// @dev update the proxy record whenever owner changed on any proxy
    /// Throws if msg.sender is not a proxy contract created via this contract
    /// @return proxy () UserWallet
    function build(
        address _owner,
        address[] calldata _targets,
        bytes[] calldata _datas,
        address _origin
    ) external payable returns (address _SLA) {
        _SLA = createClone();
        SLAInterface SLAContract = SLAInterface(_SLA);
        SLAContract.setBasics(_owner);
        listInterface(list).addAuthModReg(_owner, _SLA);
        if (_targets.length > 0) SLAContract.cast(_targets, _datas, _origin);
        emit SLACreated(msg.sender, _owner, _SLA, _origin);
    }

    function build(
        address _owner,
        address _origin
    ) external payable returns (address _SLA) {
        _SLA = createClone();
        SLAInterface SLAContract = SLAInterface(_SLA);
        SLAContract.setBasics(_owner);
        listInterface(list).addAuthModReg(_owner, _SLA);
        emit SLACreated(msg.sender, _owner, _SLA, _origin);
    }

    function setBasics(
        address _master,
        address _list,
        address _account,
        address _connectors
    ) external {
        require(
            master == address(0) &&
            list == address(0) &&
            account == address(0) &&
            connectors == address(0),
            "already-defined"
        );
        master = _master;
        list = _list;
        account = _account;
        connectors = _connectors;
    }

}