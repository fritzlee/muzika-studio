import { app, BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import * as url from 'url';
import * as path from 'path';
import { ipfsPath } from 'go-ipfs-wrapper';
import { IpfsService, IpfsServiceInstance } from './ipfs.service';
import { IpcMainServiceInstance } from './ipc.service';
import { IpcWalletServiceInstance } from './ipc-wallet.service';
import { StorageServiceInstance } from './storage.service';
import * as ms from 'ms';
import { MuzikaUpdater } from './auto-update.service';
import { StoreServiceInstance } from './store.service';
import { combineLatest, from, Observable, timer } from 'rxjs';
import { filter, map, mergeMap, take, takeWhile, timeout } from 'rxjs/operators';
import { WindowType, WinOpts } from './util/window-options';
import { RenderOptions } from './models/render-options';

export interface MuzikaAppOptions {
  healthyTimeCheck?: number;                        // the interval time for checking all services alive and restoring
  state?: any;
}

export class MuzikaApp {
  mainWindow: BrowserWindow;                        // current main window
  instancesForCheck = [IpfsServiceInstance];        // instances that should be always alive for service

  private _updateChecker: MuzikaUpdater;            // update checker
  private _isDevMode: boolean;                      // whether it is develop environment or not
  private _options: any;                            // application options
  private _isAlive = false;                         // whether the application is activated or not

  constructor() {
    this.mainWindow = null;
  }

  /**
   * Initializes an application manager.
   * @param {boolean} _isDevMode whether it is development mode or not
   * @param {any} _options
   */
  init(_isDevMode: boolean, _options: MuzikaAppOptions = {}) {
    this._isDevMode = _isDevMode;
    this._options = _options;
    this._updateChecker = new MuzikaUpdater();

    // initialize main service.
    IpcMainServiceInstance.init();
    StorageServiceInstance.init();
    StoreServiceInstance.init(this._options.state);

    // set ipfs path
    IpfsService.setIpfsExecPath((_isDevMode) ? ipfsPath : ipfsPath.replace('app.asar', 'app.asar.unpacked'));
  }

  activate() {
    this.mainWindow = this._createLoadingWindow();
    this.mainWindow.on('show', () => {
      this._isAlive = true;

      // initialize service instances.
      IpfsServiceInstance.init((this._isDevMode) ? '' : app.getPath('userData'));
      IpcWalletServiceInstance.init();

      // for every 10 seconds, check instances that are healthy.
      timer(10000, this._options.healthyTimeCheck || ms('10s')).pipe(
        takeWhile(() => this._isAlive)
      ).subscribe(() => this.restoreInstances());

      // if not updatable and ipfs is ready, close the loading screen and open the main window
      const updatable$ = StoreServiceInstance.select('app', 'updatable');
      const ipfsStatus$ = StoreServiceInstance.select('app', 'serviceStatus', 'ipfs');

      combineLatest(
        updatable$, ipfsStatus$
      ).pipe(
        filter(([updatable, ipfsStatus]) => updatable !== undefined && ipfsStatus === true),
        timeout(10000),
        take(1)
      ).subscribe(
        // if ready to service, close the loading screen and open the main window to user
        // if update available, wait for update and restart
        ([updatable]) => {
          if (updatable === 'not-available') {
            // no need to update, ready to service
            this.mainWindow.removeAllListeners('close');
            this._convertWindow(WindowType.MAIN, WinOpts.getMainWindowOpts(), 'index.html').setMenu(null);
          } else {
            // if updatable, wait for downloading update file
            updatable$.pipe(
              filter(updateStatus => updateStatus === 'available'),
              take(1)
            ).subscribe(() => {
              // if finished to download update file,
              // TODO: procedure after downloading update file
            });
          }
        },

        // error would be raised almost by timeout
        (err) => {
          // TODO: handle timeout error
        }
      );

      setTimeout(() => this._updateChecker.checkUpdate(), 2000);
    });

    this.mainWindow.show();
    this.mainWindow.webContents.openDevTools();
    this.mainWindow.on('closed', () => this.mainWindow = null);
  }

  /**
   * Try to restore unhealthy instances.
   */
  restoreInstances() {
    this.getUnhealthyInstances().subscribe((unhealthyInstance) => {
      // TODO: restore instance
    });
  }

  /**
   * Returns all unhealthy instances.
   */
  getUnhealthyInstances(): Observable<any> {
    return from(this.instancesForCheck).pipe(
      mergeMap(instance => instance.isHealthy().pipe(
        map(healthy => [instance, healthy])
      )),
      filter((instance, healthy) => !healthy)
    );
  }

  private _createLoadingWindow(): BrowserWindow {
    const loadingWindow = this._createWindow(
      WindowType.LOADING_SCREEN,
      WinOpts.getLoadingScreenOpts(),
      { hideNavBar: true, hideTitleBar: true }
    );
    loadingWindow.on('close', app.quit);
    this._loadURL(loadingWindow, 'index.html', 'loading-screen');
    return loadingWindow;
  }

  private _createAboutWindow() {
  }

  /**
   * let browser window load an URL.
   * @param window browser window to load
   * @param renderPath relative path from the renderer.
   * @param hash fragment portion of URL.
   */
  private _loadURL(window: BrowserWindow, renderPath: string, hash?: string) {
    if (this._isDevMode) {
      // https://github.com/yan-foto/electron-reload/issues/16
      require('electron-reload')(__dirname, {
        electron: require(`${__dirname}/../../../node_modules/electron`)
      });
      // window.loadURL('http://localhost:4200/' + renderPath + '#/' + hash);
      window.loadURL(url.format({
        pathname: `localhost:4200/${renderPath}`,
        protocol: 'http:',
        slashes: true,
        hash
      }));
    } else {
      window.loadURL(url.format({
        pathname: path.join(__dirname, '..', 'renderer', renderPath),
        protocol: 'file:',
        slashes: true,
        hash
      }));
    }
  }

  // noinspection JSMethodCanBeStatic
  /**
   * Constructs a new window with parameter options and inject additional
   * variable is injected to the browser window object for syncing the
   * redux state.
   * @param windowType window type
   * @param options options for browser window creation
   * @param renderOptions options for muzika renderer
   * @private
   */
  private _createWindow(windowType: string, options: BrowserWindowConstructorOptions, renderOptions?: RenderOptions) {
    const window = new BrowserWindow(options);

    // inject some main info to the browser window instance
    // this variables can be used in the electron renderer by `
    // remote.getCurrentWindow().[variable name]`.
    (window as any).store = StoreServiceInstance.store.getState();
    (window as any).platform = WinOpts.getRenderingPlatform();
    (window as any).renderOptions = Object.assign({}, renderOptions);
    (window as any).windowType = windowType;
    return window;
  }

  /**
   * Converts the current main window to other window.
   * @param windowType window type
   * @param options window options
   * @param renderPath file path for rendering
   * @param renderOptions rendering options for a new window
   * @private
   */
  private _convertWindow(windowType: string, options: BrowserWindowConstructorOptions, renderPath: string, renderOptions?: RenderOptions) {
    const startWindow = this._createWindow(windowType, options, renderOptions);

    this._loadURL(startWindow, renderPath);

    // if develop mode, open the dev tools
    if (this._isDevMode) {
      startWindow.webContents.openDevTools();
    }

    // remove closed listener
    if (this.mainWindow !== null) {
      this.mainWindow.removeAllListeners('closed');
    }

    // change the main window reference
    const prevWindow = this.mainWindow;
    this.mainWindow = startWindow;

    // when the main window is shown, finalize loading window.
    if (prevWindow !== null) {
      this.mainWindow.once('show', () => prevWindow.close());
    }

    this.mainWindow.once('closed', () => this.mainWindow = null);

    return this.mainWindow;
  }
}

export const MuzikaAppInstance = new MuzikaApp();
