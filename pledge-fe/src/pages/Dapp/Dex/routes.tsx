import React, { Suspense, lazy } from 'react';
import { Route, Switch } from 'react-router-dom';

import pageURL from '_constants/pageURL';

import Swap from '_src/pages/Dapp/Dex/Swap';
import Pool from '_src/pages/Dapp/Dex/Pool';
import PoolFinder from '_src/pages/Dapp/Dex/PoolFinder';
import AddLiquidity from '_src/pages/Dapp/Dex/AddLiquidity';
import RemoveLiquidity from '_src/pages/Dapp/Dex/RemoveLiquidity';
import { RedirectOldRemoveLiquidityPathStructure } from '_src/pages/Dapp/Dex/RemoveLiquidity/redirects';

import {
  RedirectDuplicateTokenIds,
  RedirectOldAddLiquidityPathStructure,
} from '_src/pages/Dapp/Dex//AddLiquidity/redirects';
const routeMap = [
  {
    path: pageURL.DEX_Swap,
    component: Swap,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.DEX_Pool,
    component: Pool,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Find,
    component: PoolFinder,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Add,
    component: AddLiquidity,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Add_Single,
    component: RedirectOldAddLiquidityPathStructure,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Add_Double,
    component: RedirectDuplicateTokenIds,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Remove_Tokens,
    component: RedirectOldRemoveLiquidityPathStructure,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Remove_Liquidity,
    component: RemoveLiquidity,
    exact: true,
    dynamic: true,
  },
  {
    path: '*',
    component: Swap,
    exact: true,
    dynamic: false,
  },
];

const Routes = () => {
  return (
    <Suspense fallback={null}>
      <Switch>
        {routeMap.map((item, index) => (
          <Route key={index} path={item.path} exact={item.exact} component={item.component} />
        ))}
      </Switch>
    </Suspense>
  );
};

export default Routes;
