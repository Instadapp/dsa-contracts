pragma solidity ^0.7.0;

contract Variables {
    // Auth Module(Address of Auth => bool).
    mapping (address => bool) private _auth;

    function updateAuth(address user) internal {
        if (_auth[user]) {
            delete _auth[user];
        } else {
            _auth[user] = true;
        }
    }

    function getAuth(address user) internal view returns (bool) {
        return _auth[user];
    }

}