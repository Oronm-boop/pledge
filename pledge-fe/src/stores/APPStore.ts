import { action, observable, makeAutoObservable, toJS } from 'mobx';

class APPStore {
  constructor(self) {
    makeAutoObservable(this, {});
    this.init();
  }

  /**
   * After adding the wallet KeyStore data, the next time you open the wallet plug-in, the ready-to-eat data will be read from Chrome.storage.sync, and the data has been restored.
   * @memberof APPStore
   */
  async init() {}

  setAppInfo() {}

  importApp() {}
}

export default APPStore;
