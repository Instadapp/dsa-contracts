pragma solidity ^0.7.0;

import "hardhat/console.sol";

interface CTokenInterface {
    function mint(uint mintAmount) external returns (uint);
    function redeem(uint redeemTokens) external returns (uint);
    function borrow(uint borrowAmount) external returns (uint);
    function repayBorrow(uint repayAmount) external returns (uint);
    function repayBorrowBehalf(address borrower, uint repayAmount) external returns (uint); // For ERC20
    function liquidateBorrow(address borrower, uint repayAmount, address cTokenCollateral) external returns (uint);

    function borrowBalanceCurrent(address account) external returns (uint);
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function exchangeRateCurrent() external returns (uint);

    function balanceOf(address owner) external view returns (uint256 balance);
}

interface CETHInterface {
    function mint() external payable;
    function repayBorrow() external payable;
    function repayBorrowBehalf(address borrower) external payable;
    function liquidateBorrow(address borrower, address cTokenCollateral) external payable;
}

interface TokenInterface {
    function approve(address, uint256) external;
    function transfer(address, uint) external;
    function transferFrom(address, address, uint) external;
    function deposit() external payable;
    function withdraw(uint) external;
    function balanceOf(address) external view returns (uint);
    function decimals() external view returns (uint);
}

interface ComptrollerInterface {
    function enterMarkets(address[] calldata cTokens) external returns (uint[] memory);
    function exitMarket(address cTokenAddress) external returns (uint);
    function getAssetsIn(address account) external view returns (address[] memory);
    function getAccountLiquidity(address account) external view returns (uint, uint, uint);
    function claimComp(address) external;
}

interface InstaMapping {
    function cTokenMapping(address) external view returns (address);
}

interface MemoryInterface {
    function getUint(uint _id) external returns (uint _num);
    function setUint(uint _id, uint _val) external;
}

interface CompoundMappingInterface {
    function cTokenMapping(string calldata tokenId) external view returns (address);
    function getMapping(string calldata tokenId) external view returns (address, address);
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

contract Events {
    event LogDeposit(
        address indexed token,
        address cToken,
        uint256 tokenAmt,
        uint256 getId,
        uint256 setId
    );

    event LogWithdraw(
        address indexed token,
        address cToken,
        uint256 tokenAmt,
        uint256 getId,
        uint256 setId
    );

    event LogBorrow(
        address indexed token,
        address cToken,
        uint256 tokenAmt,
        uint256 getId,
        uint256 setId
    );

    event LogPayback(
        address indexed token,
        address cToken,
        uint256 tokenAmt,
        uint256 getId,
        uint256 setId
    );

    event LogDepositCToken(
        address indexed token,
        address cToken,
        uint256 tokenAmt,
        uint256 cTokenAmt,
        uint256 getId, 
        uint256 setId
    );

    event LogWithdrawCToken(
        address indexed token,
        address cToken,
        uint256 tokenAmt,
        uint256 cTokenAmt,
        uint256 getId,
        uint256 setId
    );
    
    event LogLiquidate(
        address indexed borrower,
        address indexed tokenToPay,
        address indexed tokenInReturn,
        uint256 tokenAmt,
        uint256 getId,
        uint256 setId
    );
}

contract DSMath {

    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, "math-not-safe");
    }

    function mul(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, "math-not-safe");
    }

    uint constant WAD = 10 ** 18;

    function wmul(uint x, uint y) internal pure returns (uint z) {
        z = add(mul(x, y), WAD / 2) / WAD;
    }

    function wdiv(uint x, uint y) internal pure returns (uint z) {
        z = add(mul(x, WAD), y / 2) / y;
    }

    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, "ds-math-sub-underflow");
    }

}

abstract contract Basic is DSMath, Stores {

    function convert18ToDec(uint _dec, uint256 _amt) internal pure returns (uint256 amt) {
        amt = (_amt / 10 ** (18 - _dec));
    }

    function convertTo18(uint _dec, uint256 _amt) internal pure returns (uint256 amt) {
        amt = mul(_amt, 10 ** (18 - _dec));
    }

    function getTokenBal(TokenInterface token) internal view returns(uint _amt) {
        _amt = address(token) == ethAddr ? address(this).balance : token.balanceOf(address(this));
    }

    function getTokensDec(TokenInterface buyAddr, TokenInterface sellAddr) internal view returns(uint buyDec, uint sellDec) {
        buyDec = address(buyAddr) == ethAddr ?  18 : buyAddr.decimals();
        sellDec = address(sellAddr) == ethAddr ?  18 : sellAddr.decimals();
    }

    function encodeEvent(string memory eventName, bytes memory eventParam) internal pure returns (bytes memory) {
        return abi.encode(eventName, eventParam);
    }

    function approve(TokenInterface token, address spender, uint256 amount) internal {
        try token.approve(spender, amount) {

        } catch {
            token.approve(spender, 0);
            token.approve(spender, amount);
        }
    }

    function changeEthAddress(address buy, address sell) internal pure returns(TokenInterface _buy, TokenInterface _sell){
        _buy = buy == ethAddr ? TokenInterface(wethAddr) : TokenInterface(buy);
        _sell = sell == ethAddr ? TokenInterface(wethAddr) : TokenInterface(sell);
    }

    function convertEthToWeth(bool isEth, TokenInterface token, uint amount) internal {
        if(isEth) token.deposit{value: amount}();
    }

    function convertWethToEth(bool isEth, TokenInterface token, uint amount) internal {
       if(isEth) {
            approve(token, address(token), amount);
            token.withdraw(amount);
        }
    }
}


abstract contract Helpers is DSMath, Basic {
    /**
     * @dev Compound Comptroller
     */
    ComptrollerInterface internal constant troller = ComptrollerInterface(0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B);

    /**
     * @dev Compound Mapping
     */
    CompoundMappingInterface internal constant compMapping = CompoundMappingInterface(0xe7a85d0adDB972A4f0A4e57B698B37f171519e88);

    /**
     * @dev enter compound market
     */
    function enterMarket(address cToken) internal {
        address[] memory markets = troller.getAssetsIn(address(this));
        bool isEntered = false;
        for (uint i = 0; i < markets.length; i++) {
            if (markets[i] == cToken) {
                isEntered = true;
            }
        }
        if (!isEntered) {
            address[] memory toEnter = new address[](1);
            toEnter[0] = cToken;
            troller.enterMarkets(toEnter);
        }
    }
}

abstract contract CompoundResolver is Helpers {
    /**
     * @dev Deposit ETH/ERC20_Token.
     * @notice Deposit a token to Compound for lending / collaterization.
     * @param token The address of the token to deposit. (For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param cToken The address of the corresponding cToken.
     * @param amt The amount of the token to deposit. (For max: `uint256(-1)`)
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of tokens deposited.
    */
    function depositRaw(
        address token,
        address cToken,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) public payable returns (string memory _eventName, bytes memory _eventParam) {
        uint _amt = getUint(getId, amt);

        require(token != address(0) && cToken != address(0), "invalid token/ctoken address");

        enterMarket(cToken);
        if (token == ethAddr) {
            _amt = _amt == uint(-1) ? address(this).balance : _amt;
            CETHInterface(cToken).mint{value: _amt}();
        } else {
            TokenInterface tokenContract = TokenInterface(token);
            _amt = _amt == uint(-1) ? tokenContract.balanceOf(address(this)) : _amt;
            approve(tokenContract, cToken, _amt);
            require(CTokenInterface(cToken).mint(_amt) == 0, "deposit-failed");
        }

        _eventName = "LogDeposit(address,address,uint256,uint256,uint256)";
        _eventParam = abi.encode(token, cToken, _amt, getId, setId);
    }

    /**
     * @dev Deposit ETH/ERC20_Token using the Mapping.
     * @notice Deposit a token to Compound for lending / collaterization.
     * @param tokenId The token id of the token to deposit.(For eg: ETH-A)
     * @param amt The amount of the token to deposit. (For max: `uint256(-1)`)
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of tokens deposited.
    */
    function deposit(
        string calldata tokenId,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) external payable returns (string memory _eventName, bytes memory _eventParam) {
        (address token, address cToken) = compMapping.getMapping(tokenId);
        (_eventName, _eventParam) = depositRaw(token, cToken, amt, getId, setId);
    }

    /**
     * @dev Withdraw ETH/ERC20_Token.
     * @notice Withdraw deposited token from Compound
     * @param token The address of the token to withdraw. (For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param cToken The address of the corresponding cToken.
     * @param amt The amount of the token to withdraw. (For max: `uint256(-1)`)
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of tokens withdrawn.
    */
    function withdrawRaw(
        address token,
        address cToken,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) public payable returns (string memory _eventName, bytes memory _eventParam) {
        uint _amt = getUint(getId, amt);
        require(token != address(0) && cToken != address(0), "invalid token/ctoken address");

        CTokenInterface cTokenContract = CTokenInterface(cToken);
        if (_amt == uint(-1)) {
            TokenInterface tokenContract = TokenInterface(token);
            uint initialBal = token == ethAddr ? address(this).balance : tokenContract.balanceOf(address(this));
            require(cTokenContract.redeem(cTokenContract.balanceOf(address(this))) == 0, "full-withdraw-failed");
            uint finalBal = token == ethAddr ? address(this).balance : tokenContract.balanceOf(address(this));
            _amt = finalBal - initialBal;
        } else {
            console.log("amount", _amt);
            require(cTokenContract.redeemUnderlying(_amt) == 0, "withdraw-failed");
        }
        setUint(setId, _amt);

        _eventName = "LogWithdraw(address,address,uint256,uint256,uint256)";
        _eventParam = abi.encode(token, cToken, _amt, getId, setId);
    }

    /**
     * @dev Withdraw ETH/ERC20_Token using the Mapping.
     * @notice Withdraw deposited token from Compound
     * @param tokenId The token id of the token to withdraw.(For eg: ETH-A)
     * @param amt The amount of the token to withdraw. (For max: `uint256(-1)`)
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of tokens withdrawn.
    */
    function withdraw(
        string calldata tokenId,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) external payable returns (string memory _eventName, bytes memory _eventParam) {
        (address token, address cToken) = compMapping.getMapping(tokenId);
        (_eventName, _eventParam) = withdrawRaw(token, cToken, amt, getId, setId);
    }

    /**
     * @dev Borrow ETH/ERC20_Token.
     * @notice Borrow a token using Compound
     * @param token The address of the token to borrow. (For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param cToken The address of the corresponding cToken.
     * @param amt The amount of the token to borrow.
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of tokens borrowed.
    */
    function borrowRaw(
        address token,
        address cToken,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) public payable returns (string memory _eventName, bytes memory _eventParam) {
        uint _amt = getUint(getId, amt);

        require(token != address(0) && cToken != address(0), "invalid token/ctoken address");

        enterMarket(cToken);
        require(CTokenInterface(cToken).borrow(_amt) == 0, "borrow-failed");
        setUint(setId, _amt);

        _eventName = "LogBorrow(address,address,uint256,uint256,uint256)";
        _eventParam = abi.encode(token, cToken, _amt, getId, setId);
    }

     /**
     * @dev Borrow ETH/ERC20_Token using the Mapping.
     * @notice Borrow a token using Compound
     * @param tokenId The token id of the token to borrow.(For eg: DAI-A)
     * @param amt The amount of the token to borrow.
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of tokens borrowed.
    */
    function borrow(
        string calldata tokenId,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) external payable returns (string memory _eventName, bytes memory _eventParam) {
        (address token, address cToken) = compMapping.getMapping(tokenId);
        (_eventName, _eventParam) = borrowRaw(token, cToken, amt, getId, setId);
    }

    /**
     * @dev Payback borrowed ETH/ERC20_Token.
     * @notice Payback debt owed.
     * @param token The address of the token to payback. (For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param cToken The address of the corresponding cToken.
     * @param amt The amount of the token to payback. (For max: `uint256(-1)`)
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of tokens paid back.
    */
    function paybackRaw(
        address token,
        address cToken,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) public payable returns (string memory _eventName, bytes memory _eventParam) {
        uint _amt = getUint(getId, amt);

        require(token != address(0) && cToken != address(0), "invalid token/ctoken address");

        CTokenInterface cTokenContract = CTokenInterface(cToken);
        _amt = _amt == uint(-1) ? cTokenContract.borrowBalanceCurrent(address(this)) : _amt;

        if (token == ethAddr) {
            require(address(this).balance >= _amt, "not-enough-eth");
            CETHInterface(cToken).repayBorrow{value: _amt}();
        } else {
            TokenInterface tokenContract = TokenInterface(token);
            require(tokenContract.balanceOf(address(this)) >= _amt, "not-enough-token");
            approve(tokenContract, cToken, _amt);
            require(cTokenContract.repayBorrow(_amt) == 0, "repay-failed.");
        }
        setUint(setId, _amt);

        _eventName = "LogPayback(address,address,uint256,uint256,uint256)";
        _eventParam = abi.encode(token, cToken, _amt, getId, setId);
    }

    /**
     * @dev Payback borrowed ETH/ERC20_Token using the Mapping.
     * @notice Payback debt owed.
     * @param tokenId The token id of the token to payback.(For eg: COMP-A)
     * @param amt The amount of the token to payback. (For max: `uint256(-1)`)
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of tokens paid back.
    */
    function payback(
        string calldata tokenId,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) external payable returns (string memory _eventName, bytes memory _eventParam) {
        (address token, address cToken) = compMapping.getMapping(tokenId);
        (_eventName, _eventParam) = paybackRaw(token, cToken, amt, getId, setId);
    }

    /**
     * @dev Deposit ETH/ERC20_Token.
     * @notice Same as depositRaw. The only difference is this method stores cToken amount in set ID.
     * @param token The address of the token to deposit. (For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param cToken The address of the corresponding cToken.
     * @param amt The amount of the token to deposit. (For max: `uint256(-1)`)
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of cTokens received.
    */
    function depositCTokenRaw(
        address token,
        address cToken,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) public payable returns (string memory _eventName, bytes memory _eventParam) {
        uint _amt = getUint(getId, amt);

        require(token != address(0) && cToken != address(0), "invalid token/ctoken address");

        enterMarket(cToken);

        CTokenInterface ctokenContract = CTokenInterface(cToken);
        uint initialBal = ctokenContract.balanceOf(address(this));

        if (token == ethAddr) {
            _amt = _amt == uint(-1) ? address(this).balance : _amt;
            CETHInterface(cToken).mint{value: _amt}();
        } else {
            TokenInterface tokenContract = TokenInterface(token);
            _amt = _amt == uint(-1) ? tokenContract.balanceOf(address(this)) : _amt;
            approve(tokenContract, cToken, _amt);
            require(ctokenContract.mint(_amt) == 0, "deposit-ctoken-failed.");
        }

        uint _cAmt;

        {
            uint finalBal = ctokenContract.balanceOf(address(this));
            _cAmt = sub(finalBal, initialBal);

            setUint(setId, _cAmt);
        }

        _eventName = "LogDepositCToken(address,address,uint256,uint256,uint256,uint256)";
        _eventParam = abi.encode(token, cToken, _amt, _cAmt, getId, setId);
    }

    /**
     * @dev Deposit ETH/ERC20_Token using the Mapping.
     * @notice Same as deposit. The only difference is this method stores cToken amount in set ID.
     * @param tokenId The token id of the token to depositCToken.(For eg: DAI-A)
     * @param amt The amount of the token to deposit. (For max: `uint256(-1)`)
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of cTokens received.
    */
    function depositCToken(
        string calldata tokenId,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) external payable returns (string memory _eventName, bytes memory _eventParam) {
        (address token, address cToken) = compMapping.getMapping(tokenId);
        (_eventName, _eventParam) = depositCTokenRaw(token, cToken, amt, getId, setId);
    }

    /**
     * @dev Withdraw CETH/CERC20_Token using cToken Amt.
     * @notice Same as withdrawRaw. The only difference is this method fetch cToken amount in get ID.
     * @param token The address of the token to withdraw. (For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param cToken The address of the corresponding cToken.
     * @param cTokenAmt The amount of cTokens to withdraw
     * @param getId ID to retrieve cTokenAmt 
     * @param setId ID stores the amount of tokens withdrawn.
    */
    function withdrawCTokenRaw(
        address token,
        address cToken,
        uint cTokenAmt,
        uint getId,
        uint setId
    ) public payable returns (string memory _eventName, bytes memory _eventParam) {
        uint _cAmt = getUint(getId, cTokenAmt);
        require(token != address(0) && cToken != address(0), "invalid token/ctoken address");

        CTokenInterface cTokenContract = CTokenInterface(cToken);
        TokenInterface tokenContract = TokenInterface(token);
        _cAmt = _cAmt == uint(-1) ? cTokenContract.balanceOf(address(this)) : _cAmt;

        uint withdrawAmt;
        {
            uint initialBal = token != ethAddr ? tokenContract.balanceOf(address(this)) : address(this).balance;
            require(cTokenContract.redeem(_cAmt) == 0, "redeem-failed");
            uint finalBal = token != ethAddr ? tokenContract.balanceOf(address(this)) : address(this).balance;

            withdrawAmt = sub(finalBal, initialBal);
        }

        setUint(setId, withdrawAmt);

        _eventName = "LogWithdrawCToken(address,address,uint256,uint256,uint256,uint256)";
        _eventParam = abi.encode(token, cToken, withdrawAmt, _cAmt, getId, setId);
    }

    /**
     * @dev Withdraw CETH/CERC20_Token using cToken Amt & the Mapping.
     * @notice Same as withdraw. The only difference is this method fetch cToken amount in get ID.
     * @param tokenId The token id of the token to withdraw CToken.(For eg: ETH-A)
     * @param cTokenAmt The amount of cTokens to withdraw
     * @param getId ID to retrieve cTokenAmt 
     * @param setId ID stores the amount of tokens withdrawn.
    */
    function withdrawCToken(
        string calldata tokenId,
        uint cTokenAmt,
        uint getId,
        uint setId
    ) external payable returns (string memory _eventName, bytes memory _eventParam) {
        (address token, address cToken) = compMapping.getMapping(tokenId);
        (_eventName, _eventParam) = withdrawCTokenRaw(token, cToken, cTokenAmt, getId, setId);
    }

    /**
     * @dev Liquidate a position.
     * @notice Liquidate a position.
     * @param borrower Borrower's Address.
     * @param tokenToPay The address of the token to pay for liquidation.(For ETH: 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE)
     * @param cTokenPay Corresponding cToken address.
     * @param tokenInReturn The address of the token to return for liquidation.
     * @param cTokenColl Corresponding cToken address.
     * @param amt The token amount to pay for liquidation.
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of paid for liquidation.
    */
    function liquidateRaw(
        address borrower,
        address tokenToPay,
        address cTokenPay,
        address tokenInReturn,
        address cTokenColl,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) public payable returns (string memory _eventName, bytes memory _eventParam) {
        uint _amt = getUint(getId, amt);
        require(tokenToPay != address(0) && cTokenPay != address(0), "invalid token/ctoken address");
        require(tokenInReturn != address(0) && cTokenColl != address(0), "invalid token/ctoken address");

        CTokenInterface cTokenContract = CTokenInterface(cTokenPay);

        {
            (,, uint shortfal) = troller.getAccountLiquidity(borrower);
            require(shortfal != 0, "account-cannot-be-liquidated");
            _amt = _amt == uint(-1) ? cTokenContract.borrowBalanceCurrent(borrower) : _amt;
        }

        if (tokenToPay == ethAddr) {
            require(address(this).balance >= _amt, "not-enought-eth");
            CETHInterface(cTokenPay).liquidateBorrow{value: _amt}(borrower, cTokenColl);
        } else {
            TokenInterface tokenContract = TokenInterface(tokenToPay);
            require(tokenContract.balanceOf(address(this)) >= _amt, "not-enough-token");
            approve(tokenContract, cTokenPay, _amt);
            require(cTokenContract.liquidateBorrow(borrower, _amt, cTokenColl) == 0, "liquidate-failed");
        }
        
        setUint(setId, _amt);

        _eventName = "LogLiquidate(address,address,address,uint256,uint256,uint256)";
        _eventParam = abi.encode(
            address(this),
            tokenToPay,
            tokenInReturn, 
            _amt,
            getId,
            setId
        );
    }

    /**
     * @dev Liquidate a position using the mapping.
     * @notice Liquidate a position using the mapping.
     * @param borrower Borrower's Address.
     * @param tokenIdToPay token id of the token to pay for liquidation.(For eg: ETH-A)
     * @param tokenIdInReturn token id of the token to return for liquidation.(For eg: USDC-A)
     * @param amt token amount to pay for liquidation.
     * @param getId ID to retrieve amt.
     * @param setId ID stores the amount of paid for liquidation.
    */
    function liquidate(
        address borrower,
        string calldata tokenIdToPay,
        string calldata tokenIdInReturn,
        uint256 amt,
        uint256 getId,
        uint256 setId
    ) external payable returns (string memory _eventName, bytes memory _eventParam) {
        (address tokenToPay, address cTokenToPay) = compMapping.getMapping(tokenIdToPay);
        (address tokenInReturn, address cTokenColl) = compMapping.getMapping(tokenIdInReturn);

        (_eventName, _eventParam) = liquidateRaw(
            borrower,
            tokenToPay,
            cTokenToPay,
            tokenInReturn,
            cTokenColl,
            amt,
            getId,
            setId
        );
    }
}

contract ConnectV2Compound is CompoundResolver {
    string public name = "Compound-v1.1";
}
