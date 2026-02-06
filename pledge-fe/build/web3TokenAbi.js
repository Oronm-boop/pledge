const { exec } = require('child_process');

exec(
  `abi-types-generator './src/abis/AddressPrivileges.json' --output='./src/contracts' --name=AddressPrivileges --provider=web3`,
);
exec(
  `abi-types-generator './src/abis/BscPledgeOracle.json' --output='./src/contracts' --name=BscPledgeOracle --provider=web3`,
);
exec(`abi-types-generator './src/abis/DebtToken.json' --output='./src/contracts' --name=DebtToken --provider=web3`);
exec(`abi-types-generator './src/abis/PledgePool.json' --output='./src/contracts' --name=PledgePool --provider=web3`);
exec(`abi-types-generator './src/abis/ERC20.json' --output='./src/contracts' --name=ERC20 --provider=web3`);
exec(
  `abi-types-generator './src/abis/PledgerBridgeBSC.json' --output='./src/contracts' --name=PledgerBridgeBSC --provider=web3`,
);

exec(
  `abi-types-generator './src/abis/PledgerBridgeETH.json' --output='./src/contracts' --name=PledgerBridgeETH --provider=web3`,
);
exec(`abi-types-generator './src/abis/IBEP20.json' --output='./src/contracts' --name=IBEP20 --provider=web3`);
