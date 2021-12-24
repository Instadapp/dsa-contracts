/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { InstaEvent, InstaEventInterface } from "../InstaEvent";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_instaList",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint64",
        name: "connectorType",
        type: "uint64",
      },
      {
        indexed: true,
        internalType: "uint64",
        name: "connectorID",
        type: "uint64",
      },
      {
        indexed: true,
        internalType: "uint64",
        name: "accountID",
        type: "uint64",
      },
      {
        indexed: true,
        internalType: "bytes32",
        name: "eventCode",
        type: "bytes32",
      },
      {
        indexed: false,
        internalType: "bytes",
        name: "eventData",
        type: "bytes",
      },
    ],
    name: "LogEvent",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_connectorType",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "_connectorID",
        type: "uint256",
      },
      {
        internalType: "bytes32",
        name: "_eventCode",
        type: "bytes32",
      },
      {
        internalType: "bytes",
        name: "_eventData",
        type: "bytes",
      },
    ],
    name: "emitEvent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "instaList",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const _bytecode =
  "0x60a060405234801561001057600080fd5b506040516103d93803806103d98339818101604052602081101561003357600080fd5b81019080805190602001909291905050508073ffffffffffffffffffffffffffffffffffffffff1660808173ffffffffffffffffffffffffffffffffffffffff1660601b815250505060805160601c61033b61009e60003980610108528061012e525061033b6000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80634a1fbd0e1461003b578063e14d4fb11461006f575b600080fd5b610043610106565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b6101046004803603608081101561008557600080fd5b81019080803590602001909291908035906020019092919080359060200190929190803590602001906401000000008111156100c057600080fd5b8201836020820111156100d257600080fd5b803590602001918460018302840111640100000000831117156100f457600080fd5b909192939192939050505061012a565b005b7f000000000000000000000000000000000000000000000000000000000000000081565b60007f000000000000000000000000000000000000000000000000000000000000000073ffffffffffffffffffffffffffffffffffffffff16636cfaf5e9336040518263ffffffff1660e01b8152600401808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060206040518083038186803b1580156101b357600080fd5b505afa1580156101c7573d6000803e3d6000fd5b505050506040513d60208110156101dd57600080fd5b8101908080519060200190929190505050905060008167ffffffffffffffff161415610271576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260068152602001807f6e6f742d5341000000000000000000000000000000000000000000000000000081525060200191505060405180910390fd5b838167ffffffffffffffff168667ffffffffffffffff167ff63489ddae7a2b123ee2b1621da408adc9d4788ef2842de592c247dd1ce05229898787604051808467ffffffffffffffff168152602001806020018281038252848482818152602001925080828437600081840152601f19601f82011690508083019250505094505050505060405180910390a450505050505056fea2646970667358221220369952fec41a5d6f39f347919e1676d7b8aa3a35e859255fc51a360e7e2776d564736f6c63430007000033";

type InstaEventConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: InstaEventConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class InstaEvent__factory extends ContractFactory {
  constructor(...args: InstaEventConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  deploy(
    _instaList: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<InstaEvent> {
    return super.deploy(_instaList, overrides || {}) as Promise<InstaEvent>;
  }
  getDeployTransaction(
    _instaList: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_instaList, overrides || {});
  }
  attach(address: string): InstaEvent {
    return super.attach(address) as InstaEvent;
  }
  connect(signer: Signer): InstaEvent__factory {
    return super.connect(signer) as InstaEvent__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): InstaEventInterface {
    return new utils.Interface(_abi) as InstaEventInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): InstaEvent {
    return new Contract(address, _abi, signerOrProvider) as InstaEvent;
  }
}