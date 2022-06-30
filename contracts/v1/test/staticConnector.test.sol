pragma solidity ^0.7.0;

/**
 * @title Staic connector.
 * @dev Connector For Testing Static connectors.
 */

contract StaticTest {
    /**
     * @dev Connector ID and Type.
     */
    function connectorID() public pure returns (uint256 _type, uint256 _id) {
        (_type, _id) = (1, 4);
    }
}
