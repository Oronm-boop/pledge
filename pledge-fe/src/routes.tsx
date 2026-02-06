import React, { Suspense, lazy } from 'react';
import { Route, Switch } from 'react-router-dom';

import pageURL from '_constants/pageURL';
import Landing from '_src/pages/Dapp';

const routeMap = [
  {
    path: pageURL.Dapp,
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Market,
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Market_Pool,
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Lend_Borrow,
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.DEX_Swap,
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.DEX_Pool,
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Find,
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Add,
    component: Landing,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Add_Single,
    component: Landing,
    exact: true,
    dynamic: false,
  },
  {
    path: pageURL.Add_Double,
    component: Landing,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Remove_Tokens,
    component: Landing,
    exact: true,
    dynamic: true,
  },
  {
    path: pageURL.Remove_Liquidity,
    component: Landing,
    exact: true,
    dynamic: true,
  },
  {
    path: '*',
    component: () => <div>404</div>,
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
