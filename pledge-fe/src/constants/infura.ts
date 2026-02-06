import { SupportedChainId } from './chains';
// if (typeof INFURA_KEY === 'undefined') {
//   throw new Error(`REACT_APP_INFURA_KEY must be a defined environment variable`)
// }

/**
 * These are the network URLs used by the interface when there is not another available source of chain data
 */
export const INFURA_NETWORK_URLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: `https://bsc-dataseed.binance.org`,

  [SupportedChainId.BSCTEST]: `https://data-seed-prebsc-1-s1.binance.org:8545`,
};
