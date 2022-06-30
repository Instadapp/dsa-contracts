pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * ERC1155 Token contract
 * For testing purpose.
 */

contract TokenTest is ERC1155 {
    constructor() public ERC1155("https://token.example/api/item/{id}.json") {}

    uint256 public constant _token1 = 0;
    uint256 public constant _token2 = 1;

    event LogTransferERC1155(
        address from,
        address to,
        uint256 tokenId,
        uint256 amount
    );
    event LogTransferBatchERC1155(
        address from,
        address to,
        uint256[] tokenIds,
        uint256[] amounts
    );

    function transfer1155(
        address _to,
        uint256 id,
        uint256 amount
    ) public {
        _mint(msg.sender, id, amount, "");
        safeTransferFrom(msg.sender, _to, id, amount, "");

        emit LogTransferERC1155(msg.sender, _to, id, amount);
    }

    function transferBatch1155(
        address _to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public {
        _mintBatch(msg.sender, ids, amounts, "");
        safeBatchTransferFrom(msg.sender, _to, ids, amounts, "");

        emit LogTransferBatchERC1155(msg.sender, _to, ids, amounts);
    }
}
