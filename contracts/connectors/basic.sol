pragma solidity ^0.6.0;

interface ERC20Interface {
    function allowance(address, address) external view returns (uint);
    function balanceOf(address) external view returns (uint);
    function approve(address, uint) external;
    function transfer(address, uint) external returns (bool);
    function transferFrom(address, address, uint) external returns (bool);
}

interface AccountInterface {
    function isAuth(address _user) external view returns (bool);
}

interface MemoryInterface {
    function getUint(uint _id) external returns (uint _num);
    function setUint(uint _id, uint _val) external;
}


contract Memory {

    function getMemoryAddr() public pure returns (address) {
        return 0x0000000000000000000000000000000000000000; //InstaMemory Address
    }

    function getUint(uint getId, uint val) internal returns (uint returnVal) {
        returnVal = getId == 0 ? val : MemoryInterface(getMemoryAddr()).getUint(getId);
    }

    function setUint(uint setId, uint val) internal {
        if (setId != 0) MemoryInterface(getMemoryAddr()).setUint(setId, val);
    }

}

contract BasicResolver is Memory {

    event LogDeposit(address erc20, uint tokenAmt, uint getId, uint setId);
    event LogWithdraw(address erc20, uint tokenAmt, address to, uint getId, uint setId);

    function getEthAddr() public pure returns (address) {
        return 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    }

    function deposit(address erc20, uint tokenAmt, uint getId, uint setId) public payable {
        uint amt = getUint(getId, tokenAmt);
        if (erc20 != getEthAddr()) {
            ERC20Interface token = ERC20Interface(erc20);
            amt = amt == uint(-1) ? token.balanceOf(msg.sender) : amt;
            token.transferFrom(msg.sender, address(this), amt);
        }
        setUint(setId, amt);
        emit LogDeposit(erc20, amt, getId, setId);
    }

    function withdraw(
        address erc20,
        uint tokenAmt,
        address payable to,
        uint getId,
        uint setId
    ) public payable {
        require(AccountInterface(address(this)).isAuth(to), "invalid-address-to");
        uint amt = getUint(getId, tokenAmt);
        if (erc20 == getEthAddr()) {
            amt = amt == uint(-1) ? address(this).balance : amt;
            to.transfer(amt);
        } else {
            ERC20Interface token = ERC20Interface(erc20);
            amt = amt == uint(-1) ? token.balanceOf(address(this)) : amt;
            token.transfer(to, amt);
        }
        setUint(setId, amt);
        emit LogWithdraw(erc20, amt, to, getId, setId);
    }

}


contract ConnectBasic is BasicResolver {
    string public name = "Basic-v1";
}