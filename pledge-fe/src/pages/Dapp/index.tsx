import React, { StrictMode } from 'react';
import 'firebase/firestore';

import Header from '_components/Header';
import { WebLayout } from '_src/Layout';
import Routes from './routes';
import ApplicationUpdater from '_src/state/application/updater';
import ListsUpdater from '_src/state/lists/updater';
import MulticallUpdater from '_src/state/multicall/updater';
import TransactionUpdater from '_src/state/transactions/updater';
import ToastListener from '_components/ToastListener';
import { ResetCSS } from '@pancakeswap-libs/uikit';
import './index.less';
import Providers from './Providers';

const PortfolioPage: React.FC = () => {
  return (
    <StrictMode>
      <Providers>
        <>
          <ListsUpdater />
          <ApplicationUpdater />
          <TransactionUpdater />
          <MulticallUpdater />
          <ToastListener />
        </>
        <WebLayout className="dapp-page">
          <Header />
          <div className="dapp-router-page">
            <ResetCSS />
            <Routes />
          </div>
        </WebLayout>
      </Providers>
    </StrictMode>
  );
};
export default PortfolioPage;
