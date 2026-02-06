import type { ChainBridgeConfig } from './ChainBridge.d';

const ChainBridge: ChainBridgeConfig = {
  chains: [
    {
      chainId: 0,
      networkId: 56,
      name: 'Smart Chain',
      decimals: 18,
      bridgeAddress: '0xacB8C5D7be5B23644eCe55789Eb6aA6bd6C31e64',
      erc20HandlerAddress: '0x3e1066Ea99f2934e728D85b03BD72d1BbD61D2D4',
      rpcUrl: 'https://bsc-dataseed.binance.org',
      explorerUrl: 'https://bscscan.com',
      type: 'Ethereum',
      nativeTokenSymbol: 'BNB',
      tokens: [
        {
          address: '0xa1238f3dE0A159Cd79d4f3Da4bA3a9627E48112e',
          name: 'FRA BEP20',
          symbol: 'FRA',
          imageUri: 'FRAIcon',
          resourceId: '0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00',
        },
      ],
    },
    {
      chainId: 1,
      networkId: 97,
      name: 'Binance Smart Chain Testnet',
      decimals: 18,
      bridgeAddress: '0xacB8C5D7be5B23644eCe55789Eb6aA6bd6C31e64',
      erc20HandlerAddress: '0x3e1066Ea99f2934e728D85b03BD72d1BbD61D2D4',
      rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      explorerUrl: 'https://testnet.bscscan.com',
      type: 'Ethereum',
      nativeTokenSymbol: 'tBNB',
      tokens: [
        {
          address: '0xa1238f3dE0A159Cd79d4f3Da4bA3a9627E48112e',
          name: 'FRA BEP20',
          symbol: 'FRA',
          imageUri: 'FRAIcon',
          resourceId: '0x000000000000000000000000000000c76ebe4a02bbc34786d860b355f5a5ce00',
        },
      ],
    },
  ],
};

export default ChainBridge;
