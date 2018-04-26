/* GENERATED BY TYPECHAIN VER. 0.1.5-remake */
/* tslint:disable */

import * as contract from 'truffle-contract';
import { BigNumber } from 'bignumber.js';
import {
  EtherAddress,
  EtherInteger,
  ITxParams,
  RawAbiDefinition,
  TruffleContract,
  TruffleContractInstance,
  TxValue,
  promisify
} from '../typechain-runtime';
import BuiltContract from '../../../build/contracts/MuzikaCoinSavingsWallet.json';

export interface IMuzikaCoinSavingsWallet extends TruffleContractInstance {
  heartbeatTimeout(): Promise<BigNumber>;
  owner(): Promise<string>;
  heir(): Promise<string>;
  timeOfDeath(): Promise<BigNumber>;

  claimHeirOwnership: {
    (txParams?: ITxParams): Promise<void>;
    sendTransaction: (txParams?: ITxParams) => Promise<void>;
    call: (txParams?: ITxParams) => Promise<void>;
    request: () => Promise<string>;
    estimateGas: () => Promise<number>;
  };
  setHeir: {
    (newHeir: EtherAddress, txParams?: ITxParams): Promise<void>;
    sendTransaction: (
      newHeir: EtherAddress,
      txParams?: ITxParams
    ) => Promise<void>;
    call: (newHeir: EtherAddress, txParams?: ITxParams) => Promise<void>;
    request: (newHeir: EtherAddress) => Promise<string>;
    estimateGas: (newHeir: EtherAddress) => Promise<number>;
  };
  proclaimDeath: {
    (txParams?: ITxParams): Promise<void>;
    sendTransaction: (txParams?: ITxParams) => Promise<void>;
    call: (txParams?: ITxParams) => Promise<void>;
    request: () => Promise<string>;
    estimateGas: () => Promise<number>;
  };
  heartbeat: {
    (txParams?: ITxParams): Promise<void>;
    sendTransaction: (txParams?: ITxParams) => Promise<void>;
    call: (txParams?: ITxParams) => Promise<void>;
    request: () => Promise<string>;
    estimateGas: () => Promise<number>;
  };
  removeHeir: {
    (txParams?: ITxParams): Promise<void>;
    sendTransaction: (txParams?: ITxParams) => Promise<void>;
    call: (txParams?: ITxParams) => Promise<void>;
    request: () => Promise<string>;
    estimateGas: () => Promise<number>;
  };
  transferOwnership: {
    (newOwner: EtherAddress, txParams?: ITxParams): Promise<void>;
    sendTransaction: (
      newOwner: EtherAddress,
      txParams?: ITxParams
    ) => Promise<void>;
    call: (newOwner: EtherAddress, txParams?: ITxParams) => Promise<void>;
    request: (newOwner: EtherAddress) => Promise<string>;
    estimateGas: (newOwner: EtherAddress) => Promise<number>;
  };
  sendTo: {
    (payee: EtherAddress, amount: EtherInteger, txParams?: ITxParams): Promise<
      void
    >;
    sendTransaction: (
      payee: EtherAddress,
      amount: EtherInteger,
      txParams?: ITxParams
    ) => Promise<void>;
    call: (
      payee: EtherAddress,
      amount: EtherInteger,
      txParams?: ITxParams
    ) => Promise<void>;
    request: (payee: EtherAddress, amount: EtherInteger) => Promise<string>;
    estimateGas: (payee: EtherAddress, amount: EtherInteger) => Promise<number>;
  };
}

export const TruffleMuzikaCoinSavingsWallet: TruffleContract<
  IMuzikaCoinSavingsWallet
> = contract(BuiltContract);
