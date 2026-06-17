pragma solidity ^0.7.0;
pragma experimental ABIEncoderV2;

import { Variables } from "../variables.sol";

import { ECDSA } from "./ECDSA.sol";

interface IndexInterface {
    function list() external view returns (address);
}

interface ListInterface {
    function addAuth(address user) external;

    function removeAuth(address user) external;
}

contract Constants is Variables {
    uint256 public constant implementationVersion = 1;
    // InstaIndex Address.
    address public immutable instaIndex;
    // The Account Module Version.
    uint256 public constant version = 2;

    // constants for EIP712 values
    string public constant DOMAIN_SEPARATOR_NAME = "DeFi-Smart-Account";
    string public constant DOMAIN_SEPARATOR_VERSION = "2.0.0";

    // hashed EIP712 values
    bytes32 internal constant DOMAIN_SEPARATOR_NAME_HASHED = keccak256(bytes(DOMAIN_SEPARATOR_NAME));
    bytes32 internal constant DOMAIN_SEPARATOR_VERSION_HASHED = keccak256(bytes(DOMAIN_SEPARATOR_VERSION));

    bytes32 internal constant TYPE_HASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    // EIP712 typehash for signed hashes used for EIP1271 (`isValidSignature()`)
    bytes32 public constant EIP1271_TYPE_HASH = keccak256("DSA(bytes32 hash)");

    // "magic value" according to EIP1271 https://eips.ethereum.org/EIPS/eip-1271#specification
    bytes4 internal constant EIP1271_MAGIC_VALUE = 0x1626ba7e;

    // chainId
    uint256 public immutable CHAIN_ID;

    constructor(address _instaIndex) {
        instaIndex = _instaIndex;
        uint256 id;
        assembly {
            id := chainid()
        }
        CHAIN_ID = id;
    }
}

contract Record is Constants {
    constructor(address _instaIndex) Constants(_instaIndex) {}

    event LogEnableUser(address indexed user);
    event LogDisableUser(address indexed user);
    event LogBetaMode(bool indexed beta);
    event LogSignedMessage(bytes32 indexed message);
    event LogRemoveSignedMessage(bytes32 indexed message);

    /**
     * @dev Check for Auth if enabled.
     * @param user address/user/owner.
     */
    function isAuth(address user) public view returns (bool) {
        return _auth[user];
    }

    /**
     * @dev Check if Beta mode is enabled or not
     */
    function isBeta() public view returns (bool) {
        return _beta;
    }

    /**
     * @dev Returns the domain separator
    */
    function domainSeparatorV4() public view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    TYPE_HASH,
                    DOMAIN_SEPARATOR_NAME_HASHED,
                    DOMAIN_SEPARATOR_VERSION_HASHED,
                    CHAIN_ID,
                    address(this)
                )
            );
    }

    /**
     * @dev Check is `message` is signed or not
     */
    function isSignedMessage(bytes32 message) public view returns (bool) {
        return _signedMessages[message];
    }

    /**
     * @dev Enable New User.
     * @param user Owner address
     */
    function enable(address user) public {
        require(
            msg.sender == address(this) || msg.sender == instaIndex,
            "not-self-index"
        );
        require(user != address(0), "not-valid");
        require(!_auth[user], "already-enabled");
        _auth[user] = true;
        ListInterface(IndexInterface(instaIndex).list()).addAuth(user);
        emit LogEnableUser(user);
    }

    /**
     * @dev Disable User.
     * @param user Owner address
     */
    function disable(address user) public {
        require(msg.sender == address(this), "not-self");
        require(user != address(0), "not-valid");
        require(_auth[user], "already-disabled");
        delete _auth[user];
        ListInterface(IndexInterface(instaIndex).list()).removeAuth(user);
        emit LogDisableUser(user);
    }

    function toggleBeta() public {
        require(msg.sender == address(this), "not-self");
        _beta = !_beta;
        emit LogBetaMode(_beta);
    }

    /**
     * @dev ERC721 token receiver
     */
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external returns (bytes4) {
        return 0x150b7a02; // bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))
    }

    /**
     * @dev ERC1155 token receiver
     */
    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) external returns (bytes4) {
        return 0xf23a6e61; // bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))
    }

    /**
     * @dev ERC1155 token receiver
     */
    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external returns (bytes4) {
        return 0xbc197c81; // bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))
    }

    /**
     * @dev Marks a bytes32 `message` (signature digest) as signed, making it verifiable by EIP-1271 `isValidSignature()`.
     * @param message data hash to be allow-listed as signed. Input `message` is hashed with `domainSeparatorV4()` according to EIP712 typed data (`EIP1271_TYPE_HASH`)
    */
    function signMessage(bytes32 message) external {
        require(msg.sender == address(this), "not-self");

        // hashing with domain separator mitigates any potential replaying on other networks or other Avocados of the same owner
        message = ECDSA.toTypedDataHash(
            domainSeparatorV4(),
            keccak256(abi.encode(EIP1271_TYPE_HASH, message))
        );

        _signedMessages[message] = true;

        emit LogSignedMessage(message);
    }

    /**
     * @dev Removes a previously `signMessage()` signed bytes32 `message_` (signature digest).
     * @param message data hash to be removed from allow-listed signatures
    */
    function removeSignedMessage(bytes32 message) external {
        require(msg.sender == address(this), "not-self");

        delete _signedMessages[message];

        emit LogRemoveSignedMessage(message);
    }

    /**
     * @dev Should return whether the signature provided is valid for the provided data
     * @param hash      Hash of the data to be signed
     * @param signature Signature byte array associated with data
    */
    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4 magicValue) {
        // hashing with domain separator mitigates any potential replaying on other networks or other DSA of the same owner
        hash = ECDSA.toTypedDataHash(
            domainSeparatorV4(),
            keccak256(abi.encode(EIP1271_TYPE_HASH, hash))
        );

        if (signature.length == 0) {
            // must be pre-allow-listed via `signMessage()` method
            require(_signedMessages[hash], "invalid-signed-message");
        } else {
            address signer = ECDSA.recover(hash, signature);

            if (!_auth[signer]) {
                require(_signedMessages[hash], "invalid-EIP-1271-signature");
            }
        }

        return EIP1271_MAGIC_VALUE;
    }

}

contract InstaDefaultImplementation is Record {
    constructor(address _instaIndex) public Record(_instaIndex) {}

    receive() external payable {}
}
