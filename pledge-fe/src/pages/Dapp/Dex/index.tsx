import React from 'react';
import { useRouteMatch, useHistory, Switch } from 'react-router-dom';

import { Tabs } from 'antd';
import { DappLayout } from '_src/Layout';

import Routes from './routes';
import './index.less';
import styled from 'styled-components';
import Popups from '_src/components/Popups';
type Iparams = {
  mode: 'Swap' | 'Liquidity';
};

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: flex-start;
  overflow-x: hidden;
`;

const BodyWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 32px 16px;
  align-items: center;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  z-index: 1;
  justify-content: center;
  background-repeat: no-repeat;
  background-position: bottom 24px center;
  background-size: 90%;

  ${({ theme }) => theme.mediaQueries.xs} {
    background-size: auto;
  }

  ${({ theme }) => theme.mediaQueries.lg} {
    background-repeat: no-repeat;
    background-position: center 420px, 10% 230px, 90% 230px;
    background-size: contain, 266px, 266px;
    /* min-height: 90vh; */
  }
`;
const Marginer = styled.div`
  margin-top: 5rem;
`;

function Dex() {
  const history = useHistory();
  const { url: routeUrl, params } = useRouteMatch<Iparams>();
  const { mode } = params;
  function callback(key) {
    // history.replace(pageURL.DEX.replace(':mode', `${key}`));
  }

  return (
    <DappLayout title={`${mode} Dex`} className="dapp_Dex">
      <AppWrapper>
        <BodyWrapper>
          <Popups />
          <Switch>
            {/* <Route exact strict path="/swap" component={Swap} />
                      <Route exact strict path="/find" component={PoolFinder} />
                      <Route exact strict path="/pool" component={Pool} />
                      <Route exact path="/add" component={AddLiquidity} />
                      <Route exact strict path="/remove/:currencyIdA/:currencyIdB" component={RemoveLiquidity} />

                      //Redirection: These old routes are still used in the code base
                      <Route exact path="/add/:currencyIdA" component={RedirectOldAddLiquidityPathStructure} />
                      <Route exact path="/add/:currencyIdA/:currencyIdB" component={RedirectDuplicateTokenIds} />
                      <Route exact strict path="/remove/:tokens" component={RedirectOldRemoveLiquidityPathStructure} />

                      <Route component={RedirectPathToSwapOnly} /> */}
            <Routes />
          </Switch>
          <Marginer />
        </BodyWrapper>
      </AppWrapper>
    </DappLayout>
  );
}

export default Dex;
