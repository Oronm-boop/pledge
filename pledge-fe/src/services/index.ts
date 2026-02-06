import userServer from './userServer';
import { web3 } from './web3';
// ... 依次导入其他的 server module

import BscPledgeOracleServer from './BscPledgeOracle';
import ERC20Server from './ERC20Server';
import PoolServer from './PoolServer';
import IBEP20Server from './IBEP20Server';
export default {
  userServer,
  PoolServer,
  BscPledgeOracleServer,
  ERC20Server,
  IBEP20Server,
};
