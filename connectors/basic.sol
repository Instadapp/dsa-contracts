pragma solidity ^0.6.0;

interface ERC20Interface {
    function allowance(address, address) external view returns (uint);
    function balanceOf(address) external view returns (uint);
    function approve(address, uint) external;
    function transfer(address, uint) external returns (bool);
    function transferFrom(address, address, uint) external returns (bool);
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
    mapping (uint => uint) public memoryUint; // Use it to store execute data and delete in the same transaction

    /**
     * @dev get ethereum address
     */
    function getAddressETH() public pure returns (address eth) {
        eth = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
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

    /**
     * @dev `GET` function
     */
    function getUint(uint getId, uint val) internal returns (uint returnVal) {
        if (getId == 0) {
            returnVal = val;
        } else {
            returnVal = memoryUint[getId];
            delete memoryUint[getId];
        }
    }

    /**
     * @dev `SET` function
     */
    function setUint(uint setId, uint val) internal {
        if (setId != 0) {
            memoryUint[setId] = val;
        }
    }

}

contract BasicResolver is Helpers {
    mapping (address => bool) private authModules;

    function deposit(address erc20, uint tokenAmt, uint getId, uint setId) public payable {
        uint amt = getUint(getId, tokenAmt);
        if (erc20 != getAddressETH()) {
            ERC20Interface token = ERC20Interface(erc20);
            amt = amt == uint(-1) ? token.balanceOf(msg.sender) : amt;
            token.transferFrom(msg.sender, address(this), amt);
        }
        setUint(setId, amt);
    }

    function withdraw(
        address erc20,
        uint tokenAmt,
        address payable withdrawTokenTo,
        uint getId,
        uint setId
    )public {
        uint amt = getUint(getId, tokenAmt);
        require(authModules[withdrawTokenTo],"withdrawTokenTo is not a owner.");
        
        if (erc20 == getAddressETH()) {
            amt = amt == uint(-1) ? address(this).balance : amt;
            withdrawTokenTo.transfer(amt);
        } else {
            ERC20Interface token = ERC20Interface(erc20);
            amt = amt == uint(-1) ? token.balanceOf(address(this)) : amt;
            setApproval(erc20, amt, withdrawTokenTo);
            token.transfer(withdrawTokenTo, amt);
        }
        setUint(setId, amt);
    }

}


contract Basic is BasicResolver {
    receive() external payable {}
}