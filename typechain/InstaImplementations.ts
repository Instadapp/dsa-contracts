/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  BaseContract,
  BigNumber,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  Overrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export interface InstaImplementationsInterface extends utils.Interface {
  functions: {
    "addImplementation(address,bytes4[])": FunctionFragment;
    "defaultImplementation()": FunctionFragment;
    "getImplementation(bytes4)": FunctionFragment;
    "getImplementationSigs(address)": FunctionFragment;
    "getSigImplementation(bytes4)": FunctionFragment;
    "instaIndex()": FunctionFragment;
    "removeImplementation(address)": FunctionFragment;
    "setDefaultImplementation(address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "addImplementation",
    values: [string, BytesLike[]]
  ): string;
  encodeFunctionData(
    functionFragment: "defaultImplementation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getImplementation",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getImplementationSigs",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "getSigImplementation",
    values: [BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "instaIndex",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "removeImplementation",
    values: [string]
  ): string;
  encodeFunctionData(
    functionFragment: "setDefaultImplementation",
    values: [string]
  ): string;

  decodeFunctionResult(
    functionFragment: "addImplementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "defaultImplementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getImplementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getImplementationSigs",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getSigImplementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "instaIndex", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "removeImplementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "setDefaultImplementation",
    data: BytesLike
  ): Result;

  events: {
    "LogAddImplementation(address,bytes4[])": EventFragment;
    "LogRemoveImplementation(address,bytes4[])": EventFragment;
    "LogSetDefaultImplementation(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "LogAddImplementation"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "LogRemoveImplementation"): EventFragment;
  getEvent(
    nameOrSignatureOrTopic: "LogSetDefaultImplementation"
  ): EventFragment;
}

export type LogAddImplementationEvent = TypedEvent<
  [string, string[]],
  { implementation: string; sigs: string[] }
>;

export type LogAddImplementationEventFilter = TypedEventFilter<LogAddImplementationEvent>;

export type LogRemoveImplementationEvent = TypedEvent<
  [string, string[]],
  { implementation: string; sigs: string[] }
>;

export type LogRemoveImplementationEventFilter = TypedEventFilter<LogRemoveImplementationEvent>;

export type LogSetDefaultImplementationEvent = TypedEvent<
  [string, string],
  { oldImplementation: string; newImplementation: string }
>;

export type LogSetDefaultImplementationEventFilter = TypedEventFilter<LogSetDefaultImplementationEvent>;

export interface InstaImplementations extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: InstaImplementationsInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    addImplementation(
      _implementation: string,
      _sigs: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    defaultImplementation(overrides?: CallOverrides): Promise<[string]>;

    getImplementation(
      _sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    getImplementationSigs(
      _impl: string,
      overrides?: CallOverrides
    ): Promise<[string[]]>;

    getSigImplementation(
      _sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<[string]>;

    instaIndex(overrides?: CallOverrides): Promise<[string]>;

    removeImplementation(
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    setDefaultImplementation(
      _defaultImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;
  };

  addImplementation(
    _implementation: string,
    _sigs: BytesLike[],
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  defaultImplementation(overrides?: CallOverrides): Promise<string>;

  getImplementation(
    _sig: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  getImplementationSigs(
    _impl: string,
    overrides?: CallOverrides
  ): Promise<string[]>;

  getSigImplementation(
    _sig: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;

  instaIndex(overrides?: CallOverrides): Promise<string>;

  removeImplementation(
    _implementation: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  setDefaultImplementation(
    _defaultImplementation: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    addImplementation(
      _implementation: string,
      _sigs: BytesLike[],
      overrides?: CallOverrides
    ): Promise<void>;

    defaultImplementation(overrides?: CallOverrides): Promise<string>;

    getImplementation(
      _sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    getImplementationSigs(
      _impl: string,
      overrides?: CallOverrides
    ): Promise<string[]>;

    getSigImplementation(
      _sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<string>;

    instaIndex(overrides?: CallOverrides): Promise<string>;

    removeImplementation(
      _implementation: string,
      overrides?: CallOverrides
    ): Promise<void>;

    setDefaultImplementation(
      _defaultImplementation: string,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "LogAddImplementation(address,bytes4[])"(
      implementation?: string | null,
      sigs?: null
    ): LogAddImplementationEventFilter;
    LogAddImplementation(
      implementation?: string | null,
      sigs?: null
    ): LogAddImplementationEventFilter;

    "LogRemoveImplementation(address,bytes4[])"(
      implementation?: string | null,
      sigs?: null
    ): LogRemoveImplementationEventFilter;
    LogRemoveImplementation(
      implementation?: string | null,
      sigs?: null
    ): LogRemoveImplementationEventFilter;

    "LogSetDefaultImplementation(address,address)"(
      oldImplementation?: string | null,
      newImplementation?: string | null
    ): LogSetDefaultImplementationEventFilter;
    LogSetDefaultImplementation(
      oldImplementation?: string | null,
      newImplementation?: string | null
    ): LogSetDefaultImplementationEventFilter;
  };

  estimateGas: {
    addImplementation(
      _implementation: string,
      _sigs: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    defaultImplementation(overrides?: CallOverrides): Promise<BigNumber>;

    getImplementation(
      _sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getImplementationSigs(
      _impl: string,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getSigImplementation(
      _sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    instaIndex(overrides?: CallOverrides): Promise<BigNumber>;

    removeImplementation(
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    setDefaultImplementation(
      _defaultImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    addImplementation(
      _implementation: string,
      _sigs: BytesLike[],
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    defaultImplementation(
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getImplementation(
      _sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getImplementationSigs(
      _impl: string,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getSigImplementation(
      _sig: BytesLike,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    instaIndex(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    removeImplementation(
      _implementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    setDefaultImplementation(
      _defaultImplementation: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;
  };
}