# <p align="center"> DSA Contracts Test Coverage</p>

All the contracts in action have been tested and covered by the tests.<br>

Test Coverage as of **June 28, 2022**:
- Statements: `303/308`
- Branches: `191/200`
- Functions: `104/107`
- Lines: `319/324`

  ![Screenshot from 2022-06-28 14-40-42](https://user-images.githubusercontent.com/76250660/176197453-cfa7b1d5-76b7-4c63-9604-4bb9b9e54875.png)

The missing numbers in the coverage can be accounted for:

- **Functions** (missing - 3):
  - [DSMath helper contract](https://github.com/Instadapp/dsa-contracts/blob/master/contracts/v1/connectors.sol#L19) in v1 module. This helper contract is not used in the main contract, as there are no major mathematical calculations involved in the main contract - InstaAccount. So the internal functions `add()` and `sub()` aren't included in the tests. These functions have been covered in tests of [other contracts](https://github.com/Instadapp/dsa-contracts/blob/master/contracts/registry/list.sol#L13) which are using it for significant mathematical calculations. `(-2)`
  - [InstaIndex](https://github.com/Instadapp/dsa-contracts/blob/master/contracts/registry/index.sol#L153) The method `buildWithCast()` has been skipped while testing as this is not used presently in the working. `(-1)`
- **Branches** (missing - 9):
  - The branches(else condition) associated with the [DSMath](https://github.com/Instadapp/dsa-contracts/blob/master/contracts/registry/list.sol#L15) contract related to overflow which haven't been covered while testing. Appropriate check for overflow of `uint256` is added which ensures that there won't be any overflow while calculation. Testing it would requires a large number of connectors(greater than max value of `uint256`) to be generated and added to the registry such that an overflow occurs, which is not feasible or significant for testing. `(-6)`
  - Two branches associated with `buildWithCast` method stated in functions. `(-2)`
  - 'If' [condition](https://github.com/Instadapp/dsa-contracts/blob/master/contracts/v2/proxy/accountProxy.sol#L69) in `receive()`: This condition will not be reached usually, hence skipped from testing. Even if in any scenario, this condition is reached it is simply calling the `_fallback()` which has been tested separately several times. `(-1)`
- **Statements & lines**

  - The lines and statements associated with above stated functions/branches are uncovered.

Run the coverage:

```
npm run coverage
```

