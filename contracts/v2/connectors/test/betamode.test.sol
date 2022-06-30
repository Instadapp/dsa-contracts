pragma solidity ^0.7.0;

/**
 * @dev betamode connect
 */

interface AccountInterface {
    function enable(address) external;
    function disable(address) external;
    function isAuth(address) external view returns (bool);
    function isBeta() external view returns (bool);
    function toggleBeta() external;
}

contract Events {
    event LogEnableBeta();
    event LogDisableBeta();
}

abstract contract Resolver is Events {
    /**
     * @dev Enable beta mode
     * @notice enabling beta mode gives early access to new/risky features
     */
    function enable() external payable returns (string memory _eventName, bytes memory _eventParam) {
        AccountInterface _dsa = AccountInterface(address(this));
        require(!_dsa.isBeta(), "beta-already-enabled");
        _dsa.toggleBeta();

        _eventName = "LogEnableBeta()";
    }

    /**
     * @dev Disable beta mode
     * @notice disabling beta mode removes early access to new/risky features
     */
    function disable() external payable returns (string memory _eventName, bytes memory _eventParam) {
         AccountInterface _dsa = AccountInterface(address(this));
        require(_dsa.isBeta(), "beta-already-disabled");
        _dsa.toggleBeta();

        _eventName = "LogDisableBeta()";
    }
}

contract ConnectV2Beta is Resolver {
    string public constant name = "Beta-v1";
}