pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * ERC721 Token contract
 * For testing purpose.
 */

contract NFTTest is ERC721 {
    constructor() public ERC721("NFTTest", "NFT") {}

    uint256 public _tokenIds;

    event LogTransferERC721(address from, address to, uint256 tokenId);

    function transferNFT(address _to) public {
        _tokenIds++;

        uint256 newItemId = _tokenIds;
        _mint(msg.sender, newItemId);
        safeTransferFrom(msg.sender, _to, newItemId);

        emit LogTransferERC721(msg.sender, _to, newItemId);
    }
}
