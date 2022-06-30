pragma solidity ^0.7.0;

/**
 * @title Staic connector.
 * @dev Connector For Testing Static connectors.
 */

contract StaticTest {

     /**
     * @dev Connector ID and Type.
     */
    function connectorID() public pure returns(uint _type, uint _id) {
        (_type, _id) = (1, 4);
    }

}