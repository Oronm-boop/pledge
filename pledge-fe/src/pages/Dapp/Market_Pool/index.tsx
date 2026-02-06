import React, { useState, useEffect } from 'react';
import { useRouteMatch, useHistory } from 'react-router-dom';

import { Tabs } from 'antd';
import { DappLayout } from '_src/Layout';
import Coin_pool from '_components/Coin_pool';

import './index.less';

type Iparams = {
  coin: string;
  pool: 'BUSD' | 'USDC' | 'DAI';
  mode: 'Borrower' | 'Lender';
};
function MarketPage() {
  const history = useHistory();
  const { url: routeUrl, params } = useRouteMatch<Iparams>();
  const { coin, pool, mode } = params;
  const { TabPane } = Tabs;
  const callback = (key) => {
    history.push(key);
  };
  useEffect(() => {}, []);
  console.log(params);
  return (
    <DappLayout className="dapp_coin_page">
      <Tabs defaultActiveKey="1" onChange={callback} activeKey={mode}>
        <TabPane tab="Lender" key="Lender">
          <Coin_pool mode="Lend" pool={pool} coin={coin} />
        </TabPane>
        <TabPane tab="Borrower" key="Borrower">
          <Coin_pool mode="Borrow" pool={pool} coin={coin} />
        </TabPane>
      </Tabs>
    </DappLayout>
  );
}

export default MarketPage;
