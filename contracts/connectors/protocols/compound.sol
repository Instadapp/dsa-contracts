pragma solidity ^0.6.0;

interface CTokenInterface {
    function mint(uint mintAmount) external returns (uint); // For ERC20
    function redeem(uint redeemTokens) external returns (uint);
    function repayBorrow(uint repayAmount) external returns (uint); // For ERC20
    function repayBorrowBehalf(address borrower, uint repayAmount) external returns (uint); // For ERC20
    function liquidateBorrow(address borrower, uint repayAmount, address cTokenCollateral) external returns (uint);

    function borrowBalanceCurrent(address account) external returns (uint);
    function redeemUnderlying(uint redeemAmount) external returns (uint);
    function borrow(uint borrowAmount) external returns (uint);
    function exchangeRateCurrent() external returns (uint);
    function totalBorrowsCurrent() external returns (uint);

    function balanceOf(address owner) external view returns (uint256 balance);
}

interface CETHInterface {
    function mint() external payable; // For ETH
    function repayBorrow() external payable; // For ETH
    function repayBorrowBehalf(address borrower) external payable; // For ERC20
    function liquidateBorrow(address borrower, address cTokenCollateral) external payable;

}

interface ERC20Interface {
    function allowance(address, address) external view returns (uint);
    function balanceOf(address) external view returns (uint);
    function approve(address, uint) external;
    function transfer(address, uint) external returns (bool);
    function transferFrom(address, address, uint) external returns (bool);
}

interface ComptrollerInterface {
    function enterMarkets(address[] calldata cTokens) external returns (uint[] memory);
    function exitMarket(address cTokenAddress) external returns (uint);
    function getAssetsIn(address account) external view returns (address[] memory);
    function getAccountLiquidity(address account) external view returns (uint, uint, uint);
}

interface InstaCompoundMapping {
    function ctokenAddrs(address) external view returns (address);
}

interface AccountInterface {
    function isAuth(address _user) external view returns (bool);
}

interface MemoryInterface {
    function getUint(uint _id) external returns (uint _num);
    function setUint(uint _id, uint _val) external;
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

}


contract Helpers is DSMath {
    /**
     * @dev get ethereum address
     */
    function getAddressETH() public pure returns (address eth) {
        eth = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    }

    /**
     * @dev get Compound Comptroller Address
     */
    function getComptrollerAddress() public pure returns (address troller) {
        troller = 0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B;
    }

    /**
     * @dev get InstaDApp Compound Mapping Address
     */
    function getCompMappingAddr() public pure returns (address compMap) {
        compMap = 0x3e980fB77B2f63613cDDD3C130E4cc10E90Ad6d1;
    }

    function getMemoryAddr() public pure returns (address) {
        return 0x47c260091a51d87c94A80fC4adaEab382eEACdEb; //InstaMemory Address
    }

    /**
     * @dev enter compound market
     */
    function enterMarket(address cErc20) internal {
        ComptrollerInterface troller = ComptrollerInterface(getComptrollerAddress());
        address[] memory markets = troller.getAssetsIn(address(this));
        bool isEntered = false;
        for (uint i = 0; i < markets.length; i++) {
            if (markets[i] == cErc20) {
                isEntered = true;
            }
        }
        if (!isEntered) {
            address[] memory toEnter = new address[](1);
            toEnter[0] = cErc20;
            troller.enterMarkets(toEnter);
        }
    }

    /**
     * @dev give allowance if required
     */
    function setApproval(address erc20, uint srcAmt, address to) internal {
        ERC20Interface token = ERC20Interface(erc20);
        uint tokenAllowance = token.allowance(address(this), to);
        if (srcAmt > tokenAllowance) {
            token.approve(to, srcAmt);
        }
    }

    function getUint(uint getId, uint val) internal returns (uint returnVal) {
        returnVal = getId == 0 ? val : MemoryInterface(getMemoryAddr()).getUint(getId);
    }

    function setUint(uint setId, uint val) internal {
        if (setId != 0) MemoryInterface(getMemoryAddr()).setUint(setId, val);
    }

}

contract BasicResolver is Helpers{
     function deposit(address erc20, uint tokenAmt, uint getId, uint setId) public {
        uint amt = getUint(getId, tokenAmt);
        address cErc20 = InstaCompoundMapping(getCompMappingAddr()).ctokenAddrs(erc20);
        enterMarket(cErc20);
        if (erc20 == getAddressETH()) {
            amt = amt == uint(-1) ? address(this).balance : amt;
            CETHInterface(cErc20).mint.value(amt)();
        } else {
            ERC20Interface token = ERC20Interface(erc20);
            amt = amt == uint(-1) ? token.balanceOf(address(this)) : amt;
            setApproval(erc20, amt, cErc20);
            assert(CTokenInterface(cErc20).mint(amt) == 0);
        }
        setUint(setId, amt);
    }

    function withdraw(address erc20, uint tokenAmt, uint getId, uint setId) public {
        uint amt = getUint(getId, tokenAmt);
        address cErc20 = InstaCompoundMapping(getCompMappingAddr()).ctokenAddrs(erc20);
        CTokenInterface cToken = CTokenInterface(cErc20);
        uint toBurn = cToken.balanceOf(address(this));
        uint tokenToReturn = wmul(toBurn, cToken.exchangeRateCurrent());
        amt = amt == uint(-1) ? tokenToReturn : amt;
        setApproval(cErc20, amt, cErc20);
        require(cToken.redeemUnderlying(tokenToReturn) == 0, "something went wrong");
        setUint(setId, amt);
    }

    function borrow(address erc20, uint tokenAmt, uint getId, uint setId) public {
        uint amt = getUint(getId, tokenAmt);
        address cErc20 = InstaCompoundMapping(getCompMappingAddr()).ctokenAddrs(erc20);
        enterMarket(cErc20);
        require(CTokenInterface(cErc20).borrow(amt) == 0, "got collateral?");
        setUint(setId, amt);
    }

    function payback(address erc20, uint tokenAmt, uint getId, uint setId) public {
        uint amt = getUint(getId, tokenAmt);
        address cErc20 = InstaCompoundMapping(getCompMappingAddr()).ctokenAddrs(erc20);
        CTokenInterface cToken = CTokenInterface(cErc20);
        uint borrows = cToken.borrowBalanceCurrent(address(this));
        amt = amt == uint(-1) ? borrows : amt;

        if (erc20 == getAddressETH()) {
            uint toRepay = address(this).balance;
            amt = amt > toRepay ? toRepay : amt;
            CETHInterface(cErc20).repayBorrow.value(toRepay)();
        } else {
            ERC20Interface token = ERC20Interface(erc20);
            uint toRepay = token.balanceOf(address(this));
            amt = amt > toRepay ? toRepay : amt;
            setApproval(erc20, amt, cErc20);
            require(cToken.repayBorrow(amt) == 0, "repay-failed");
        }
        setUint(setId, amt);
    }
}

contract ExtraResolver is BasicResolver {
    function withdrawCToken(address erc20, uint cTokenAmt, uint getId, uint setId) public {
        uint amt = getUint(getId, cTokenAmt);
        address cErc20 = InstaCompoundMapping(getCompMappingAddr()).ctokenAddrs(erc20);
        CTokenInterface cToken = CTokenInterface(cErc20);
        uint toBurn = cToken.balanceOf(address(this));
        amt = amt == uint(-1) ? toBurn : amt;
        setApproval(cErc20, amt, cErc20);
        require(cToken.redeem(amt) == 0, "something went wrong");
        setUint(setId, amt);
    }

    function paybackBehalf(
        address borrower,
        address erc20,
        uint tokenAmt,
        uint getId,
        uint setId
    ) external
    {
        uint amt = getUint(getId, tokenAmt);
        address cErc20 = InstaCompoundMapping(getCompMappingAddr()).ctokenAddrs(erc20);
        CTokenInterface cToken = CTokenInterface(cErc20);
        uint borrows = cToken.borrowBalanceCurrent(borrower);
        amt = amt == uint(-1) ? borrows : amt;
        if (erc20 == getAddressETH()) {
            uint toRepay = address(this).balance;
            amt = amt > toRepay ? toRepay : amt;
            CETHInterface(cErc20).repayBorrowBehalf.value(amt)(borrower);
        } else {
            ERC20Interface token = ERC20Interface(erc20);
            uint toRepay = token.balanceOf(address(this));
            amt = amt > toRepay ? toRepay : amt;
            setApproval(erc20, amt, cErc20);
            require(cToken.repayBorrowBehalf(borrower, amt) == 0, "something went wrong");
        }
        setUint(setId, amt);
    }

    function liquidate(
        address borrower,
        address erc20,
        address erc20Collateral,
        uint tokenAmt,
        uint getId,
        uint setId
    ) external
    {
        uint amt = getUint(getId, tokenAmt);
        address cErc20 = InstaCompoundMapping(getCompMappingAddr()).ctokenAddrs(erc20);
        address cErc20Collateral = InstaCompoundMapping(getCompMappingAddr()).ctokenAddrs(erc20Collateral);
        CTokenInterface cToken = CTokenInterface(cErc20);

        (,, uint shortfal) = ComptrollerInterface(getComptrollerAddress()).getAccountLiquidity(borrower);
        require(shortfal != 0, "Account cannot be liquidated");

        amt = amt == uint(-1) ? cToken.borrowBalanceCurrent(borrower) : amt; // not sure of this, have to check.
        if (erc20 == getAddressETH()) {
            uint toRepay = address(this).balance;
            amt = amt > toRepay ? toRepay : amt;
            CETHInterface(cErc20).liquidateBorrow.value(amt)(borrower, cErc20Collateral);
        } else {
            uint toRepay = ERC20Interface(erc20).balanceOf(address(this));
            amt = amt > toRepay ? toRepay : amt;
            setApproval(erc20, amt, cErc20);
            require(cToken.liquidateBorrow(borrower, toRepay, cErc20Collateral) == 0, "something went wrong");
        }
        setUint(setId, amt);
    }


}


contract ConnectCompound is ExtraResolver {
    string public name = "Compound-v1";

}