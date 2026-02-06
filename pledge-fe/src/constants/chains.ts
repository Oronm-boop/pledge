/**
 * List of all the networks supported by the Uniswap Interface
 */
export enum SupportedChainId {
  MAINNET = 56,
  BSCTEST = 97,
}

export const CHAIN_IDS_TO_NAMES = {
  [SupportedChainId.MAINNET]: 'BSC-mainnet',
  [SupportedChainId.BSCTEST]: 'BSC-testnet',
};

/**
 * Array of all the supported chain IDs
 */
export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = Object.values(SupportedChainId).filter(
  (id) => typeof id === 'number',
) as SupportedChainId[];

export const DEV_SUPPORTED_CHAIN_IDS = [SupportedChainId.BSCTEST];
export const PRO_SUPPORTED_CHAIN_IDS = [SupportedChainId.MAINNET];

// export const SUPPORTED_GAS_ESTIMATE_CHAIN_IDS = [
//   SupportedChainId.MAINNET,
//   SupportedChainId.POLYGON,
//   SupportedChainId.OPTIMISM,
//   SupportedChainId.ARBITRUM_ONE,
// ]

/**
 * All the chain IDs that are running the Ethereum protocol.
 */
// export const L1_CHAIN_IDS = [
//   SupportedChainId.MAINNET,
//   SupportedChainId.ROPSTEN,
//   SupportedChainId.RINKEBY,
//   SupportedChainId.GOERLI,
//   SupportedChainId.KOVAN,
//   SupportedChainId.POLYGON,
//   SupportedChainId.POLYGON_MUMBAI,
// ] as const

// export type SupportedL1ChainId = typeof L1_CHAIN_IDS[number]

/**
 * Controls some L2 specific behavior, e.g. slippage tolerance, special UI behavior.
 * The expectation is that all of these networks have immediate transaction confirmation.
 */
// export const L2_CHAIN_IDS = [
//   SupportedChainId.ARBITRUM_ONE,
//   SupportedChainId.ARBITRUM_RINKEBY,
//   SupportedChainId.OPTIMISM,
//   SupportedChainId.OPTIMISTIC_KOVAN,
// ] as const

// export type SupportedL2ChainId = typeof L2_CHAIN_IDS[number]
