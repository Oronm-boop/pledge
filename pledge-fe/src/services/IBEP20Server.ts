import { gasOptions, getIBEP20Contract, getDefaultAccount } from './web3';
import type { IBEP20 } from '_src/contracts/IBEP20';
import { pledge_address, ORACLE_address } from '_src/utils/constants';

const IBEP20Server = {
  async getfaucet_transfer(contractAddress) {
    const contract = getIBEP20Contract(contractAddress);
    const account = await getDefaultAccount();
    let options = await gasOptions();

    const rates = await contract.methods.faucet_transfer(account).send(options);
    return rates;
  },
};

export default IBEP20Server;
