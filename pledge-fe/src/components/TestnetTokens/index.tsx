import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import { DappLayout } from '_src/Layout';
import Button from '_components/Button';
import BUSD from '_src/assets/images/BUSDcoin.png';
import BTCB from '_src/assets/images/order_BTCB.png';
import USDT from '_src/assets/images/order_USDT.png';
import DAI from '_src/assets/images/order_DAI.png';
import BNB from '_src/assets/images/order_BNB.png';
import Success from '_src/assets/images/Success.png';
import Error from '_src/assets/images/Error.png';
import icon3 from '_src/assets/images/icon (3).png';
import icon4 from '_src/assets/images/icon (4).png';
import Union from '_src/assets/images/union.png';
import { Progress, notification, Divider, Space } from 'antd';

import './index.less';
import services from '_src/services';
import { web3 } from '_src/services/web3';
import { useActiveWeb3React } from '_src/hooks';

export interface ITestnetTokens {
  className?: string;
  style?: React.CSSProperties;
  props?: any;
  mode: string;
}

const TestnetTokens: React.FC<ITestnetTokens> = ({ className, style, props, mode }) => {
  const [loadingsbusd, setloadingsbusd] = useState(false);
  const [loadingsbtc, setloadingsbtc] = useState(false);

  const [loadingsdai, setloadingsdai] = useState(false);
  const { connector, library, chainId, account, activate, deactivate, active, error } = useActiveWeb3React();

  const getImporttoken = (address, coin) => {
    library.provider
      .request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: address,
            symbol: coin,
            decimals: 18,
          },
        },
      })
      .then((success) => {
        console.log(success);
      })
      .catch(() => console.log(false));
  };
  const openNotificationclaim = (placement) => {
    notification.config({
      closeIcon: <img src={Union} alt="" style={{ width: '10px', height: '10px', margin: '14px' }} />,
    });
    notification.open({
      style: { width: '340px', height: '90px', padding: '0' },

      message: (
        <div
          style={{
            border: '1px solid #2DE0E0',
            width: '340px',
            height: '90px',
            background: ' #fff',
            borderRadius: '4px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            padding: '21px',
          }}
        >
          <div
            className="messagetab"
            style={{
              display: 'flex',
            }}
          >
            <img src={Success} alt="" style={{ width: '22px', height: '22px', marginRight: '11px' }} />
            <p style={{ fontSize: '16px', lineHeight: '24px', fontWeight: 600, margin: '0' }}>{placement}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p style={{ margin: '0 9.4px 0 33px' }}>{'Claim success'}</p>{' '}
            <img src={icon3} alt="" style={{ width: '11.2px', height: '11.2px' }} />
          </div>
        </div>
      ),
    });
  };
  const openNotificationerrorclaim = (placement) => {
    notification.config({
      closeIcon: <img src={Union} alt="" style={{ width: '10px', height: '10px', margin: '14px' }} />,
    });
    notification.open({
      style: { width: '340px', height: '90px', padding: '0' },

      message: (
        <div
          style={{
            border: '1px solid #ff3369',
            width: '340px',
            height: '90px',
            background: ' #fff',
            borderRadius: '4px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            padding: '21px',
          }}
        >
          <div
            className="messagetaberror"
            style={{
              display: 'flex',
            }}
          >
            <img src={Error} alt="" style={{ width: '22px', height: '22px', marginRight: '11px' }} />
            <p style={{ fontSize: '16px', lineHeight: '24px', fontWeight: 600, margin: '0' }}>{placement}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p style={{ margin: '0 9.4px 0 33px' }}>{'claim error'}</p>{' '}
            <img src={icon4} alt="" style={{ width: '11.2px', height: '11.2px' }} />
          </div>
        </div>
      ),
    });
  };
  return (
    <div style={style}>
      <DappLayout title={'Get Testnet Tokens'} className="testnetpages">
        <ul>
          <li>
            <img src={BNB} alt="" />
            <p className="tokenname">Testnet BNB</p>
            <p style={{ marginBottom: '95px' }} className="tokenaddress">
              Please use faucet link to get BNB in testnet
            </p>
            <Button onClick={() => window.open('https://testnet.binance.org/faucet-smart')}>Go to Faucet</Button>
          </li>
          <li>
            <img src={BTCB} alt="" />
            <p className="tokenname">Testnet BTCB</p>
            <Button
              style={{
                border: '1px solid rgba(93, 82, 255, 0.5)',
                borderRadius: '8px',
                width: '95px',
                height: '30px',
                color: '#5D52FF',
                lineHeight: '10px',
                padding: '10px 4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                background: '#fff',
                margin: '0 auto 24px ',
              }}
              onClick={() => getImporttoken('0xB5514a4FA9dDBb48C3DE215Bc9e52d9fCe2D8658', 'BTCB')}
            >
              Add Token
            </Button>
            <p className="tokenaddress">0xB5514a4FA9dDBb48C3DE215Bc9e52d9fCe2D8658</p>
            <Button
              loading={loadingsbtc}
              onClick={() => {
                setloadingsbtc(true);
                services.IBEP20Server.getfaucet_transfer('0xB5514a4FA9dDBb48C3DE215Bc9e52d9fCe2D8658')
                  .then((res) => {
                    openNotificationclaim('Success'), setloadingsbtc(false);
                  })
                  .catch(() => {
                    openNotificationerrorclaim('error'), setloadingsbtc(false);
                  });
              }}
            >
              Claim
            </Button>
          </li>
          <li>
            <img src={BUSD} alt="" />
            <p className="tokenname">Testnet BUSD</p>
            <Button
              style={{
                border: '1px solid rgba(93, 82, 255, 0.5)',
                borderRadius: '8px',
                width: '95px',
                height: '30px',
                color: '#5D52FF',
                lineHeight: '10px',
                padding: '10px 4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                background: '#fff',
                margin: '0 auto 24px ',
              }}
              onClick={() => getImporttoken('0xE676Dcd74f44023b95E0E2C6436C97991A7497DA', 'BUSD')}
            >
              Add Token
            </Button>
            <p className="tokenaddress">0xE676Dcd74f44023b95E0E2C6436C97991A7497DA</p>
            <Button
              loading={loadingsbusd}
              onClick={() => {
                setloadingsbusd(true);
                services.IBEP20Server.getfaucet_transfer('0xE676Dcd74f44023b95E0E2C6436C97991A7497DA')
                  .then((res) => {
                    openNotificationclaim('Success'), setloadingsbusd(false);
                  })
                  .catch(() => {
                    openNotificationerrorclaim('error'), setloadingsbusd(false);
                  });
              }}
            >
              Claim
            </Button>
          </li>
          <li>
            <img src={DAI} alt="" />
            <p className="tokenname">Testnet DAI</p>
            <Button
              style={{
                border: '1px solid rgba(93, 82, 255, 0.5)',
                borderRadius: '8px',
                width: '95px',
                height: '30px',
                color: '#5D52FF',
                lineHeight: '10px',
                padding: '10px 4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                background: '#fff',
                margin: '0 auto 24px ',
              }}
              onClick={() => getImporttoken('0x490BC3FCc845d37C1686044Cd2d6589585DE9B8B', 'DAI')}
            >
              Add Token
            </Button>
            <p className="tokenaddress">0x490BC3FCc845d37C1686044Cd2d6589585DE9B8B</p>
            <Button
              loading={loadingsdai}
              onClick={() => {
                setloadingsdai(true);
                services.IBEP20Server.getfaucet_transfer('0x490BC3FCc845d37C1686044Cd2d6589585DE9B8B')
                  .then((res) => {
                    openNotificationclaim('Success'), setloadingsdai(false);
                  })
                  .catch(() => {
                    openNotificationerrorclaim('error'), setloadingsdai(false);
                  });
              }}
            >
              Claim
            </Button>
          </li>
        </ul>
      </DappLayout>
    </div>
  );
};

TestnetTokens.defaultProps = {
  className: '',
  style: null,
  mode: '',
};

export default TestnetTokens;
