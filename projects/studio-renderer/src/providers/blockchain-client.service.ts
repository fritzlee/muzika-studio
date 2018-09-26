import { Inject, Injectable } from '@angular/core';
import { EnvironmentV2Token, ExtendedWeb3, OntologyClient } from '@muzika/core/angular';
import {
  AccountBalance,
  AppActionType,
  BlockChainProtocol,
  EnvironmentTypeV2,
  IAppState,
  promisify,
  toBigNumber,
  unitUp
} from '@muzika/core';
import { RpcClient, Crypto } from 'ontology-ts-sdk';
import * as ethWallet from 'ethereumjs-wallet';
import * as Web3 from 'web3';
import { MuzikaWalletProvider } from './muzika-wallet.provider';
import { WalletStorageService } from '../modules/wallet/services/wallet-storage.service';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';

/**
 * This class produces an interface for interacting with various blockchain protocol as a
 * same interface.
 *
 * SUPPORT LIST
 *  - Ethereum (MainNet / TestNet)
 *  - Ontology (MainNet / TestNet)
 */
@Injectable({providedIn: 'root'})
export class BlockChainClient {
  blockChain: BehaviorSubject<BlockChainProtocol>;
  private _client: Web3 | RpcClient;

  constructor(
    private web3: ExtendedWeb3,
    private store: Store<IAppState>,
    private ontClient: OntologyClient,
    private walletProvider: MuzikaWalletProvider,
    private walletStorage: WalletStorageService,
    @Inject(EnvironmentV2Token) private environment: EnvironmentTypeV2,
  ) {
    this.blockChain = new BehaviorSubject<BlockChainProtocol>({
      protocol: 'eth',
      network: (environment.production) ? 'mainNet' : 'testNet'
    });

    this.blockChain.asObservable().subscribe(blockChain => {
      this._switchClient(blockChain);
      this.store.dispatch({
        type: AppActionType.SET_PROTOCOL,
        payload: { ...blockChain }
      });
    });
  }

  /**
   * Generates a random private key for the current protocol wallet.
   */
  randomPrivateKey(): string {
    switch (this.protocol) {
      case 'eth':
        const wallet = ethWallet.generate();
        return wallet.getPrivateKey().toString('hex');

      case 'ont':
        return Crypto.PrivateKey.random().key;
    }
  }

  /**
   * Adds a wallet in the current blockchain protocol.
   *
   * @param privateKey private key for wallet.
   * @param name the name of wallet.
   * @param password password of wallet.
   */
  async addWallet(name: string, privateKey: string, password: string = '') {
    await this.walletStorage.addWallet(this.protocol, name, privateKey, password);
  }

  /**
   * Deletes a wallet in the current blockchain protocol.
   *
   * @param name the name of wallet to delete.
   */
  deleteWallet(name: string) {
    this.walletStorage.deleteWallet(this.protocol, name);
  }

  /**
   * Gets a wallet list from the current blockchain protocol.
   */
  async getWallets(): Promise<any[]> {
    return await Promise.resolve(this.walletStorage.getAccounts(this.protocol));
  }

  async balanceOf(account: string): Promise<AccountBalance> {
    switch (this.protocol) {
      case 'eth':
        return await this.ethBalanceOf(account);
      case 'ont':
        return await this.ontBalanceOf(account);
    }

    throw new Error('Unsupported blockchain protocol');
  }

  /**
   * Switches the current blockchain protocol.
   * @param _protocol protocol for blockchain.
   */
  set protocol(_protocol: 'eth' | 'ont') {
    this.blockChain.next({
      protocol: _protocol,
      network: this.blockChain.value.network
    });
  }

  /**
   * Gets the current blockchain protocol.
   */
  get protocol(): 'eth' | 'ont' {
    return this.blockChain.value.protocol;
  }

  /**
   * Switches the current blockchain network type.
   * @param _network the network type (mainNet / testNet)
   */
  set network(_network: 'mainNet' | 'testNet') {
    this.blockChain.next({
      protocol: this.blockChain.value.protocol,
      network: _network
    });
  }

  /**
   * Gets the current blockchain network.
   */
  get network(): 'mainNet' | 'testNet' {
    return this.blockChain.value.network;
  }

  /**
   * Switch the client by the current blockchain protocol and network.
   * @private
   */
  private _switchClient(info: BlockChainProtocol): void {
    switch (info.protocol) {
      case 'eth':
        if (!(this._client instanceof Web3)) {
          this._client = this.web3;
        }
        const rpcUrl = this.environment.protocol.eth[info.network].rpcUrl;
        const infuraAccessToken = this.environment.protocol.eth[info.network].infuraAccessToken;
        this.walletProvider.rpcUrl = `${rpcUrl}/${infuraAccessToken}`;
        break;

      case 'ont':
        if (!(this._client instanceof RpcClient)) {
          this._client = this.ontClient;
        }
        this.ontClient.network = info.network;
        break;

      default:
        throw new Error('Unsupported blockchain protocol');
    }
  }

  private async ethBalanceOf(address: string): Promise<AccountBalance> {
    const params = {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest']
    };

    return await promisify(this.walletProvider.sendAsync.bind(this.walletProvider), params).then(v => {
      return {
        eth: unitUp(toBigNumber(v.result).toString(10))
      };
    });
  }

  private async ontBalanceOf(address: string): Promise<AccountBalance> {
    const client = <RpcClient>this._client;
    const balance = <AccountBalance>{};
    Object.assign(balance, (await client.getBalance(new Crypto.Address(address))).result);
    return balance;
  }
}