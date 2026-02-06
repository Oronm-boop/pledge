import { gasOptions, getBscPledgeOracleAbiContract } from './web3';
import type { BscPledgeOracle } from '_src/contracts/BscPledgeOracle';
import { pledge_address, ORACLE_address, ORACLE_mainaddress } from '_src/utils/constants';

const BscPledgeOracleServer = {
  async getPrice(asset, chainId) {
    const contract = getBscPledgeOracleAbiContract(
      chainId == 97 ? ORACLE_address : chainId == 56 ? ORACLE_mainaddress : ORACLE_mainaddress,
    );
    const options = await gasOptions();
    const rates = await contract.methods.getPrice(asset).call();
    return rates;
  },
  async getPrices(asset, chainId) {
    const contract = getBscPledgeOracleAbiContract(
      chainId == 97 ? ORACLE_address : chainId == 56 ? ORACLE_mainaddress : ORACLE_mainaddress,
    );
    const options = await gasOptions();
    const rates = await contract.methods.getPrices(asset).call();
    return rates;
  },
};

export default BscPledgeOracleServer;
