import { Inject, Injectable } from '@angular/core';
import { EnvironmentV2Token, ExtendedWeb3, OntologyClient } from '@muzika/core/angular';
import { AppActions, AppActionType, BlockChainProtocol, EnvironmentTypeV2, IAppState, promisify } from '@muzika/core';
import { RpcClient, Crypto } from 'ontology-ts-sdk';
import * as ethWallet from 'ethereumjs-wallet';
import * as Web3 from 'web3';
import { MuzikaWalletProvider } from './muzika-wallet.provider';
import { OntologyWalletStorageService } from './ontology/wallet-storage.service';
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
export class BlockChainClientProvider {
  blockChain: BehaviorSubject<BlockChainProtocol>;
  private _client: Web3 | RpcClient;

  constructor(
    private web3: ExtendedWeb3,
    private store: Store<IAppState>,
    private ontClient: OntologyClient,
    private walletProvider: MuzikaWalletProvider,
    private ethWalletStorage: WalletStorageService,
    private ontWalletStorage: OntologyWalletStorageService,
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
   *
   */
  randomPrivateKey(): string | Crypto.PrivateKey {
    switch (this.protocol) {
      case 'eth':
        const wallet = ethWallet.generate();
        return wallet.getPrivateKey();

      case 'ont':
        return Crypto.PrivateKey.random();
    }
  }

  /**
   * Adds a wallet in the current blockchain protocol.
   * @param privateKey private key for wallet.
   * @param name the name of wallet.
   * @param password password of wallet.
   */
  addWallet(privateKey: string | Crypto.PrivateKey = '', name: string = '', password: string = '') {
    switch (this.protocol) {
      case 'eth':
        if (privateKey instanceof Crypto.PrivateKey) {
          throw new Error('Unsupported parameter type');
        }
        this.ethWalletStorage.addWallet(privateKey);
        break;

      case 'ont':
        if (privateKey instanceof String) {
          privateKey = new Crypto.PrivateKey(<string>privateKey);
        }
        this.ontWalletStorage.addWallet(name, <Crypto.PrivateKey>privateKey, password);
        break;

      default:
        throw new Error('Unsupported blockchain protocol');
    }
  }

  /**
   * Gets a wallet list from the current blockchain protocol.
   */
  async getWallets(): Promise<string[]> {
    switch (this.protocol) {
      case 'eth':
        return await promisify((<Web3>this._client).eth.getAccounts);
      case 'ont':
        return await Promise.resolve(this.ontWalletStorage.accounts);
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
}
