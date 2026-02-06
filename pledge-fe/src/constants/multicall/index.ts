import { ChainId } from '@pswww/sdk';
import MULTICALL_ABI from './abi.json';

const MULTICALL_NETWORKS: { [chainId in ChainId]: string } = {
  [ChainId.MAINNET]: '0x1Ee38d535d541c55C9dae27B12edf090C608E6Fb', // TODO
  [ChainId.TESTNET]: '0x6287990214C85f43815252A6Fe902408D33C7383',
};

export { MULTICALL_ABI, MULTICALL_NETWORKS };
