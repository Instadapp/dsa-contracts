pragma solidity ^0.6.0;

interface GemLike {
    function approve(address, uint) external;
    function transfer(address, uint) external;
    function transferFrom(address, address, uint) external;
    function deposit() external payable;
    function withdraw(uint) external;
    function balanceOf(address) external view returns (uint);
}

interface ManagerLike {
    function cdpCan(address, uint, address) external view returns (uint);
    function ilks(uint) external view returns (bytes32);
    function owns(uint) external view returns (address);
    function urns(uint) external view returns (address);
    function vat() external view returns (address);
    function open(bytes32, address) external returns (uint);
    function give(uint, address) external;
    function cdpAllow(uint, address, uint) external;
    function urnAllow(address, uint) external;
    function frob(uint, int, int) external;
    function flux(uint, address, uint) external;
    function move(uint, address, uint) external;
    function exit(
        address,
        uint,
        address,
        uint
    ) external;
    function quit(uint, address) external;
    function enter(address, uint) external;
    function shift(uint, uint) external;
}

interface VatLike {
    function can(address, address) external view returns (uint);
    function ilks(bytes32) external view returns (uint, uint, uint, uint, uint);
    function dai(address) external view returns (uint);
    function urns(bytes32, address) external view returns (uint, uint);
    function frob(
        bytes32,
        address,
        address,
        address,
        int,
        int
    ) external;
    function hope(address) external;
    function move(address, address, uint) external;
    function gem(bytes32, address) external view returns (uint);

}

interface GemJoinLike {
    function dec() external returns (uint);
    function gem() external returns (GemLike);
    function join(address, uint) external payable;
    function exit(address, uint) external;
}

interface DaiJoinLike {
    function vat() external returns (VatLike);
    function dai() external returns (GemLike);
    function join(address, uint) external payable;
    function exit(address, uint) external;
}

interface HopeLike {
    function hope(address) external;
    function nope(address) external;
}

interface JugLike {
    function drip(bytes32) external returns (uint);
}

interface ProxyRegistryLike {
    function proxies(address) external view returns (address);
    function build(address) external returns (address);
}

interface ProxyLike {
    function owner() external view returns (address);
}

interface InstaMcdAddress {
    function manager() external returns (address);
    function dai() external returns (address);
    function daiJoin() external returns (address);
    function jug() external returns (address);
    function proxyRegistry() external returns (address);
    function ethAJoin() external returns (address);
    function pot() external returns (address);
}

interface PotLike {
    function pie(address) external view returns (uint);
    function drip() external returns (uint);
    function join(uint) external;
    function exit(uint) external;
}

interface MemoryInterface {
    function getUint(uint _id) external returns (uint _num);
    function setUint(uint _id, uint _val) external;
}

contract DSMath {

    uint256 constant RAY = 10 ** 27;

    function add(uint x, uint y) internal pure returns (uint z) {
        require((z = x + y) >= x, "math-not-safe");
    }

    function sub(uint x, uint y) internal pure returns (uint z) {
        require((z = x - y) <= x, "sub-overflow");
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

    function rdiv(uint x, uint y) internal pure returns (uint z) {
        z = add(mul(x, RAY), y / 2) / y;
    }

    function rmul(uint x, uint y) internal pure returns (uint z) {
        z = add(mul(x, y), RAY / 2) / RAY;
    }

    function toInt(uint x) internal pure returns (int y) {
        y = int(x);
        require(y >= 0, "int-overflow");
    }

    function toRad(uint wad) internal pure returns (uint rad) {
        rad = mul(wad, 10 ** 27);
    }

    function convertTo18(address gemJoin, uint256 amt) internal returns (uint256 wad) {
        // For those collaterals that have less than 18 decimals precision we need to do the conversion before passing to frob function
        // Adapters will automatically handle the difference of precision
        wad = mul(
            amt,
            10 ** (18 - GemJoinLike(gemJoin).dec())
        );
    }

}


contract Helpers is DSMath {
    /**
     * @dev get ethereum address
     */
    function getAddressETH() public pure returns (address eth) {
        eth = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    }

    function getMemoryAddr() public pure returns (address) {
        return 0x47c260091a51d87c94A80fC4adaEab382eEACdEb; //InstaMemory Address
    }

    /**
     * @dev get MakerDAO MCD Address contract
     */
    function getMcdAddresses() public pure returns (address mcd) {
        mcd = 0xF23196DF1C440345DE07feFbe556a5eF0dcD29F0;
    }

    /**
     * @dev get InstaDApp CDP's Address
     */
    function getGiveAddress() public pure returns (address addr) {
        addr = 0xc679857761beE860f5Ec4B3368dFE9752580B096;
    }

    function getUint(uint getId, uint val) internal returns (uint returnVal) {
        returnVal = getId == 0 ? val : MemoryInterface(getMemoryAddr()).getUint(getId);
    }

    function setUint(uint setId, uint val) internal {
        if (setId != 0) MemoryInterface(getMemoryAddr()).setUint(setId, val);
    }

    function flux(uint vault, address dst, uint wad) internal {
        address manager = InstaMcdAddress(getMcdAddresses()).manager();
        ManagerLike(manager).flux(vault, dst, wad);
    }

    function move(uint vault, address dst, uint rad) internal {
        address manager = InstaMcdAddress(getMcdAddresses()).manager();
        ManagerLike(manager).move(vault, dst, rad);
    }

    function frob(uint vault, int dink, int dart) internal {
        address manager = InstaMcdAddress(getMcdAddresses()).manager();
        ManagerLike(manager).frob(vault, dink, dart);
    }

    function _getDrawDart(
        address vat,
        address jug,
        address urn,
        bytes32 ilk,
        uint wad
    ) internal returns (int dart)
    {
        // Updates stability fee rate
        uint rate = JugLike(jug).drip(ilk);

        // Gets DAI balance of the urn in the vat
        uint dai = VatLike(vat).dai(urn);

        // If there was already enough DAI in the vat balance, just exits it without adding more debt
        if (dai < mul(wad, RAY)) {
            // Calculates the needed dart so together with the existing dai in the vat is enough to exit wad amount of DAI tokens
            dart = toInt(sub(mul(wad, RAY), dai) / rate);
            // This is neeeded due lack of precision. It might need to sum an extra dart wei (for the given DAI wad amount)
            dart = mul(uint(dart), rate) < mul(wad, RAY) ? dart + 1 : dart;
        }
    }

    function _getWipeDart(
        address vat,
        uint dai,
        address urn,
        bytes32 ilk
    ) internal view returns (int dart)
    {
        // Gets actual rate from the vat
        (, uint rate,,,) = VatLike(vat).ilks(ilk);
        // Gets actual art value of the urn
        (, uint art) = VatLike(vat).urns(ilk, urn);

        // Uses the whole dai balance in the vat to reduce the debt
        dart = toInt(dai / rate);
        // Checks the calculated dart is not higher than urn.art (total debt), otherwise uses its value
        dart = uint(dart) <= art ? - dart : - toInt(art);
    }

}


contract BasicResolver is Helpers {

    function open(bytes32 ilk, address usr) public returns (uint vault) {
        address manager = InstaMcdAddress(getMcdAddresses()).manager();
        vault = ManagerLike(manager).open(ilk, usr);
    }

    function give(uint vault, address usr) public {
        address manager = InstaMcdAddress(getMcdAddresses()).manager();
        ManagerLike(manager).give(vault, usr);
    }

    function deposit(
        uint vault,
        uint tokenAmt,
        address gemJoin,
        bool isEth,
        uint getId,
        uint setId
    ) public payable
    {
        uint amt = getUint(getId, tokenAmt);

        if(isEth){
            amt = amt == uint(-1) ? address(this).balance : amt;
            GemJoinLike(gemJoin).gem().deposit.value(amt)();
        } else {
            amt = amt == uint(-1) ?  GemJoinLike(gemJoin).gem().balanceOf(address(this)) : amt;
        }

        GemJoinLike(gemJoin).gem().approve(address(gemJoin), amt);
        GemJoinLike(gemJoin).join(address(this), amt);

        address manager = InstaMcdAddress(getMcdAddresses()).manager();
        VatLike(ManagerLike(manager).vat()).frob(
            ManagerLike(manager).ilks(vault),
            ManagerLike(manager).urns(vault),
            address(this),
            address(this),
            toInt(convertTo18(gemJoin, amt)),
            0
        );

        setUint(setId, amt);
    }

    function withdraw(
        uint vault,
        address gemJoin,
        uint tokenAmt,
        bool isEth,
        uint getId,
        uint setId
    ) public {
        uint amt = getUint(getId, tokenAmt);

        address manager = InstaMcdAddress(getMcdAddresses()).manager();
        address urn = ManagerLike(manager).urns(vault);
        bytes32 ilk = ManagerLike(manager).ilks(vault);

        (uint ink,) = VatLike(ManagerLike(manager).vat()).urns(ilk, urn);
        amt = amt == uint(-1) ? ink : amt;
        uint amt18 = convertTo18(gemJoin, amt);

        frob(
            vault,
            -toInt(amt18),
            0
        );

        flux(
            vault,
            address(this),
            amt18
        );

        if(isEth){
            GemJoinLike(gemJoin).exit(address(this), amt);
            GemJoinLike(gemJoin).gem().withdraw(amt);
            // msg.sender.transfer(amt); //check - withdraw to SLA or msg.sender
        } else {
            GemJoinLike(gemJoin).exit(address(this), amt); //check - withdraw to SLA or msg.sender
        }

        setUint(setId, amt);
    }

    function borrow(
        uint vault,
        uint tokenAmt,
        uint getId,
        uint setId
    ) public {
        uint amt = getUint(getId, tokenAmt);

        address manager = InstaMcdAddress(getMcdAddresses()).manager();
        address jug = InstaMcdAddress(getMcdAddresses()).jug();
        address daiJoin = InstaMcdAddress(getMcdAddresses()).daiJoin();
        address urn = ManagerLike(manager).urns(vault);
        address vat = ManagerLike(manager).vat();
        bytes32 ilk = ManagerLike(manager).ilks(vault);

        // Generates debt in the CDP
        frob(
            vault,
            0,
            _getDrawDart(
                vat,
                jug,
                urn,
                ilk,
                amt
            )
        );
        // Moves the DAI amount (balance in the vat in rad) to proxy's address
        move(
            vault,
            address(this),
            toRad(amt)
        );

        // Allows adapter to access to proxy's DAI balance in the vat
        if (VatLike(vat).can(address(this), address(daiJoin)) == 0) {
            VatLike(vat).hope(daiJoin);
        }
        // Exits DAI to the user's wallet as a token
        DaiJoinLike(daiJoin).exit(address(this), amt); //check - withdraw to SLA or msg.sender

        setUint(setId, amt);
    }

    function payback(
        uint vault,
        uint tokenAmt,
        uint getId,
        uint setId
    ) public {
        uint amt = getUint(getId, tokenAmt);


        address manager = InstaMcdAddress(getMcdAddresses()).manager();
        address vat = ManagerLike(manager).vat();
        address urn = ManagerLike(manager).urns(vault);
        bytes32 ilk = ManagerLike(manager).ilks(vault);

        (, uint rate,,,) = VatLike(vat).ilks(ilk);
        (,uint debt) = VatLike(ManagerLike(manager).vat()).urns(ilk, urn); // change7878 - is required
        amt = amt == uint(-1) ? rmul(rate, debt) : amt;

        // Joins DAI amount into the vat
        address daiJoin = InstaMcdAddress(getMcdAddresses()).daiJoin();
        DaiJoinLike(daiJoin).dai().approve(daiJoin, amt);
        DaiJoinLike(daiJoin).join(urn, amt);

        // Paybacks debt to the CDP
        frob(
            vault,
            0,
            _getWipeDart(
                vat,
                VatLike(vat).dai(urn),
                urn,
                ilk
            )
        );

        setUint(setId, amt);
    }
}


contract BasicExtraResolver is BasicResolver {
    function withdrawLiquidated(
        uint vault,
        address gemJoin,
        uint tokenAmt,
        bool isEth,
        uint getId,
        uint setId
    )
    public {
        uint amt = getUint(getId, tokenAmt);

        address manager = InstaMcdAddress(getMcdAddresses()).manager();
        address urn = ManagerLike(manager).urns(vault);
        bytes32 ilk = ManagerLike(manager).ilks(vault);
        uint ink = VatLike(ManagerLike(manager).vat()).gem(ilk, urn);

        amt = amt == uint(-1) ? ink : amt;

        uint amt18 = convertTo18(gemJoin, amt);

        flux(
            vault,
            address(this),
            amt18
        );

        // Exits amount to proxy address as a token
        GemJoinLike(gemJoin).exit(address(this), amt);
        if (isEth) {
            GemJoinLike(gemJoin).gem().withdraw(amt);
            // msg.sender.transfer(ink); // change7878
        }

        setUint(setId, amt);
    }

}

contract DsrResolver is BasicExtraResolver {
    function dsrDeposit(
        uint tokenAmt,
        uint getId,
        uint setId
    ) public {
        uint amt = getUint(getId, tokenAmt);
        address pot = InstaMcdAddress(getMcdAddresses()).pot();
        address daiJoin = InstaMcdAddress(getMcdAddresses()).daiJoin();

        VatLike vat = DaiJoinLike(daiJoin).vat();
        // Executes drip to get the chi rate updated to rho == now, otherwise join will fail
        uint chi = PotLike(pot).drip();
        // Joins wad amount to the vat balance
        // Approves adapter to take the DAI amount
        DaiJoinLike(daiJoin).dai().approve(daiJoin, amt);
        // Joins DAI into the vat
        DaiJoinLike(daiJoin).join(address(this), amt);
        // Approves the pot to take out DAI from the proxy's balance in the vat
        if (vat.can(address(this), address(pot)) == 0) {
            vat.hope(pot);
        }
        // Joins the pie value (equivalent to the DAI wad amount) in the pot
        PotLike(pot).join(mul(amt, RAY) / chi);
        setUint(setId, amt);
    }

      function dsrWithdraw(
        uint tokenAmt,
        uint getId,
        uint setId
    ) public {
        address pot = InstaMcdAddress(getMcdAddresses()).pot();
        address daiJoin = InstaMcdAddress(getMcdAddresses()).daiJoin();

        uint amt = getUint(getId, tokenAmt);

        VatLike vat = DaiJoinLike(daiJoin).vat();
        // Executes drip to count the savings accumulated until this moment
        uint chi = PotLike(pot).drip();
        // Calculates the pie value in the pot equivalent to the DAI wad amount
        uint pie = mul(amt, RAY) / chi;
        // Exits DAI from the pot
        PotLike(pot).exit(pie);
        // Checks the actual balance of DAI in the vat after the pot exit
        uint bal = DaiJoinLike(daiJoin).vat().dai(address(this));
        // Allows adapter to access to proxy's DAI balance in the vat
        if (vat.can(address(this), address(daiJoin)) == 0) {
            vat.hope(daiJoin);
        }
        // It is necessary to check if due rounding the exact wad amount can be exited by the adapter.
        // Otherwise it will do the maximum DAI balance in the vat
        DaiJoinLike(daiJoin).exit(
            address(this),
            bal >= mul(amt, RAY) ? amt : bal / RAY
        );

        setUint(setId, amt);

    }
}