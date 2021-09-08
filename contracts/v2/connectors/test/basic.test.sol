pragma solidity ^0.7.0;

import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Events {
    event LogDeposit(
        address indexed erc20,
        uint256 tokenAmt,
        uint256 getId,
        uint256 setId
    );
    event LogWithdraw(
        address indexed erc20,
        uint256 tokenAmt,
        address indexed to,
        uint256 getId,
        uint256 setId
    );
}

/**
 * @title Basic.
 * @dev Deposit & Withdraw from DSA.
 */

interface TokenInterface {
    function approve(address, uint256) external;

    function transfer(address, uint256) external;

    function transferFrom(
        address,
        address,
        uint256
    ) external;

    function deposit() external payable;

    function withdraw(uint256) external;

    function balanceOf(address) external view returns (uint256);

    function decimals() external view returns (uint256);
}

interface MemoryInterface {
    function getUint(uint256 id) external returns (uint256 num);

    function setUint(uint256 id, uint256 val) external;
}

interface InstaMapping {
    function cTokenMapping(address) external view returns (address);

    function gemJoinMapping(bytes32) external view returns (address);
}

abstract contract Stores {
    /**
     * @dev Return ethereum address
     */
    address internal constant ethAddr =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /**
     * @dev Return Wrapped ETH address
     */
    address internal constant wethAddr =
        0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    /**
     * @dev Return memory variable address
     */
    MemoryInterface internal constant instaMemory =
        MemoryInterface(0x8a5419CfC711B2343c17a6ABf4B2bAFaBb06957F);

    /**
     * @dev Return InstaDApp Mapping Addresses
     */
    InstaMapping internal constant instaMapping =
        InstaMapping(0xe81F70Cc7C0D46e12d70efc60607F16bbD617E88);

    /**
     * @dev Get Uint value from InstaMemory Contract.
     */
    function getUint(uint256 getId, uint256 val)
        internal
        returns (uint256 returnVal)
    {
        returnVal = getId == 0 ? val : instaMemory.getUint(getId);
    }

    /**
     * @dev Set Uint value in InstaMemory Contract.
     */
    function setUint(uint256 setId, uint256 val) internal virtual {
        if (setId != 0) instaMemory.setUint(setId, val);
    }
}

contract DSMath {
    function add(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x + y) >= x, "math-not-safe");
    }

    function mul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require(y == 0 || (z = x * y) / y == x, "math-not-safe");
    }

    uint256 constant WAD = 10**18;

    function wmul(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = add(mul(x, y), WAD / 2) / WAD;
    }

    function wdiv(uint256 x, uint256 y) internal pure returns (uint256 z) {
        z = add(mul(x, WAD), y / 2) / y;
    }

    function sub(uint256 x, uint256 y) internal pure returns (uint256 z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }
}

abstract contract Basic is DSMath, Stores {
    function convert18ToDec(uint256 _dec, uint256 _amt)
        internal
        pure
        returns (uint256 amt)
    {
        amt = (_amt / 10**(18 - _dec));
    }

    function convertTo18(uint256 _dec, uint256 _amt)
        internal
        pure
        returns (uint256 amt)
    {
        amt = mul(_amt, 10**(18 - _dec));
    }

    function getTokenBal(TokenInterface token)
        internal
        view
        returns (uint256 _amt)
    {
        _amt = address(token) == ethAddr
            ? address(this).balance
            : token.balanceOf(address(this));
    }

    function getTokensDec(TokenInterface buyAddr, TokenInterface sellAddr)
        internal
        view
        returns (uint256 buyDec, uint256 sellDec)
    {
        buyDec = address(buyAddr) == ethAddr ? 18 : buyAddr.decimals();
        sellDec = address(sellAddr) == ethAddr ? 18 : sellAddr.decimals();
    }

    function encodeEvent(string memory eventName, bytes memory eventParam)
        internal
        pure
        returns (bytes memory)
    {
        return abi.encode(eventName, eventParam);
    }

    function approve(
        TokenInterface token,
        address spender,
        uint256 amount
    ) internal {
        try token.approve(spender, amount) {} catch {
            token.approve(spender, 0);
            token.approve(spender, amount);
        }
    }

    function changeEthAddress(address buy, address sell)
        internal
        pure
        returns (TokenInterface _buy, TokenInterface _sell)
    {
        _buy = buy == ethAddr ? TokenInterface(wethAddr) : TokenInterface(buy);
        _sell = sell == ethAddr
            ? TokenInterface(wethAddr)
            : TokenInterface(sell);
    }

    function convertEthToWeth(
        bool isEth,
        TokenInterface token,
        uint256 amount
    ) internal {
        if (isEth) token.deposit{value: amount}();
    }

    function convertWethToEth(
        bool isEth,
        TokenInterface token,
        uint256 amount
    ) internal {
        if (isEth) {
            approve(token, address(token), amount);
            token.withdraw(amount);
        }
    }
}

abstract contract BasicResolver is Events, DSMath, Basic {
    using SafeERC20 for IERC20;

    /**
     * @dev Deposit Assets To Smart Account.
     * @notice Deposit a token to DSA
     * @param token The address of the token to deposit. (For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param amt The amount of tokens to deposit. (For max: `uint256(-1)` (Not valid for ETH))
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of tokens deposited.
     */
    function deposit(
        address token,
        uint256 amt,
        uint256 getId,
        uint256 setId
    )
        public
        payable
        returns (string memory _eventName, bytes memory _eventParam)
    {
        uint256 _amt = getUint(getId, amt);
        if (token != ethAddr) {
            IERC20 tokenContract = IERC20(token);
            _amt = _amt == uint256(-1)
                ? tokenContract.balanceOf(msg.sender)
                : _amt;
            tokenContract.safeTransferFrom(msg.sender, address(this), _amt);
        } else {
            require(
                msg.value == _amt || _amt == uint256(-1),
                "invalid-ether-amount"
            );
            _amt = msg.value;
        }
        setUint(setId, _amt);

        _eventName = "LogDeposit(address,uint256,uint256,uint256)";
        _eventParam = abi.encode(token, _amt, getId, setId);
    }

    /**
     * @dev Withdraw Assets from Smart  Account
     * @notice Withdraw a token from DSA
     * @param token The address of the token to withdraw. (For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param amt The amount of tokens to withdraw. (For max: `uint256(-1)`)
     * @param to The address to receive the token upon withdrawal
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of tokens withdrawn.
     */
    function withdraw(
        address token,
        uint256 amt,
        address payable to,
        uint256 getId,
        uint256 setId
    )
        public
        payable
        returns (string memory _eventName, bytes memory _eventParam)
    {
        uint256 _amt = getUint(getId, amt);
        if (token == ethAddr) {
            _amt = _amt == uint256(-1) ? address(this).balance : _amt;
            to.call{value: _amt}("");
        } else {
            IERC20 tokenContract = IERC20(token);
            _amt = _amt == uint256(-1)
                ? tokenContract.balanceOf(address(this))
                : _amt;
            tokenContract.safeTransfer(to, _amt);
        }
        setUint(setId, _amt);

        _eventName = "LogWithdraw(address,uint256,address,uint256,uint256)";
        _eventParam = abi.encode(token, _amt, to, getId, setId);
    }
}

contract ConnectV2Basic is BasicResolver {
    string public constant name = "Basic-v1";
}
