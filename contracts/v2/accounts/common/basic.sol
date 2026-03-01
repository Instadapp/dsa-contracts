pragma solidity ^0.7.0;

import { DSMath } from "./math.sol";
import { SafeMath } from "@openzeppelin/contracts/math/SafeMath.sol";

abstract contract Basic is DSMath {

    function convert18ToDec(uint _dec, uint256 _amt) internal pure returns (uint256 amt) {
        amt = (_amt / 10 ** SafeMath.sub(18, _dec));
    }

    function convertTo18(uint _dec, uint256 _amt) internal pure returns (uint256 amt) {
        amt = mul(_amt, 10 ** SafeMath.sub(18, _dec));
    }

}