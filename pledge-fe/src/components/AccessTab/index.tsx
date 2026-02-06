import React, { useEffect, useState } from 'react';
import classnames from 'classnames';
import services from '_src/services';
import Button from '_components/Button';
import BUSD from '_src/assets/images/order_BUSD.png';
import BTCB from '_src/assets/images/order_BTCB.png';
import USDT from '_src/assets/images/order_USDT.png';
import DAI from '_src/assets/images/order_DAI.png';
import BNB from '_src/assets/images/order_BNB.png';
import BigNumber from 'bignumber.js';
import { useActiveWeb3React } from '_src/hooks';
import { Progress, notification, Divider, Space } from 'antd';
import Success from '_src/assets/images/Success.png';
import Error from '_src/assets/images/Error.png';
import icon3 from '_src/assets/images/icon (3).png';
import icon4 from '_src/assets/images/icon (4).png';
import Union from '_src/assets/images/union.png';

import './index.less';

export interface IAccessTab {
  className?: string;
  style?: React.CSSProperties;
  mode: string;
  props: any;
  stateinfo: any;
}

const AccessTab: React.FC<IAccessTab> = ({ className, style, mode, props, stateinfo }) => {
  const { connector, library, chainId, account, activate, deactivate, active, error } = useActiveWeb3React();

  const [hasNoClaim, sethasNoClaim] = useState(false);
  const [loadings, setloadings] = useState(false);
  const [stakeAmount, setstakeAmount] = useState('');
  const [stakeAmountborrow, setstakeAmountborrow] = useState('');

  const openNotificationlend = (placement) => {
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
            <p style={{ margin: '0 9.4px 0 33px' }}>{'Claim SP-Token success'}</p>{' '}
            <img src={icon3} alt="" style={{ width: '11.2px', height: '11.2px' }} />
          </div>
        </div>
      ),
    });
  };
  const openNotificationborrow = (placement) => {
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
            <p style={{ margin: '0 9.4px 0 33px' }}>{'Claim JP-Token success'}</p>{' '}
            <img src={icon3} alt="" style={{ width: '11.2px', height: '11.2px' }} />
          </div>
        </div>
      ),
    });
  };
  const openNotificationerrorlend = (placement) => {
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
            <p style={{ margin: '0 9.4px 0 33px' }}>{'Claim SP-Token error'}</p>{' '}
            <img src={icon4} alt="" style={{ width: '11.2px', height: '11.2px' }} />
          </div>
        </div>
      ),
    });
  };
  const openNotificationerrorborrow = (placement) => {
    notification.config({
      closeIcon: <img src={Union} alt="" style={{ width: '10px', height: '10px', margin: '14px' }} />,
    });
    notification.open({
      style: { width: '340px', height: '90px', padding: '0' },
      message: (
        <div
          style={{
            border: '1px solid #ff3369',
            background: ' #fff',
            borderRadius: '4px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            width: '340px',
            padding: '21px',
            height: '90px',
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
            <p style={{ margin: '0 9.4px 0 33px' }}>{'Claim JP-Token error'}</p>{' '}
            <img src={icon4} alt="" style={{ width: '11.2px', height: '11.2px' }} />
          </div>
        </div>
      ),
    });
  };

  const dealNumber_18 = (num) => {
    if (num) {
      let x = new BigNumber(num);
      let y = new BigNumber(1e18);
      return x.dividedBy(y).toFixed();
    }
  };
  const getImporttoken = (address) => {
    services.ERC20Server.getname(address).then((res) => {
      console.log(res);
      mode == 'Lend'
        ? library.provider
            .request({
              method: 'wallet_watchAsset',
              params: {
                type: 'ERC20',
                options: {
                  address: props.Sptoken,
                  symbol: res,
                  decimals: 18,
                },
              },
            })
            .then((success) => {
              console.log(success);
            })
            .catch(() => console.log(false))
        : library.provider
            .request({
              method: 'wallet_watchAsset',
              params: {
                type: 'ERC20',
                options: {
                  address: props.Jptoken,
                  symbol: res,
                  decimals: 18,
                },
              },
            })
            .then((success) => {
              console.log(success);
            })
            .catch(() => console.log(false));
    });
  };
  const accessClaim = async () => {
    if (props.state == '1' || props.state == '2' || props.state == '3') {
      mode == 'Lend'
        ? await services.PoolServer.getclaimLend((Number(props.key) - 1).toString(), chainId)
            .then(() => {
              openNotificationlend('Success');
              setloadings(false);
            })
            .catch(() => {
              openNotificationerrorlend('Error'), setloadings(false);
            })
        : await services.PoolServer.getclaimBorrow((Number(props.key) - 1).toString(), chainId)
            .then(() => {
              openNotificationborrow('Success');
              setloadings(false);
            })
            .catch(() => {
              openNotificationerrorborrow('Error'), setloadings(false);
            });
    }
  };

  useEffect(() => {
    if (chainId !== undefined) {
      {
        mode == 'Lend'
          ? services.PoolServer.getuserLendInfo((Number(props.key) - 1).toString(), chainId).then((data) => {
              sethasNoClaim(data.hasNoClaim);
              setstakeAmount(data.stakeAmount);
            })
          : services.PoolServer.getuserBorrowInfo((Number(props.key) - 1).toString(), chainId).then((data) => {
              sethasNoClaim(data.hasNoClaim);
              setstakeAmountborrow(data.stakeAmount);
            });
      }
    }
  });

  const claimAmount =
    Number(dealNumber_18(props.lendSupply)) !== 0
      ? Number(dealNumber_18(stateinfo.pool_data.settleAmountLend)) *
        (Number(dealNumber_18(stakeAmount)) / Number(dealNumber_18(props.lendSupply)))
      : 0;
  const claimAmountborrow =
    Number(dealNumber_18(props.borrowSupply)) !== 0
      ? Math.floor(
          Number(dealNumber_18(stateinfo.pool_data.settleAmountBorrow)) *
            (Number(dealNumber_18(stakeAmountborrow)) / Number(dealNumber_18(props.borrowSupply))) *
            1000000,
        ) / 1000000
      : 0;

  return (
    <div className={classnames('access_tab')} style={style}>
      <div className="access_title">
        <img src={props.logo2} alt="" style={{ width: '40px' }} />
        <h2>{props.poolname}</h2>
      </div>

      {props.state == '0' ? (
        <div className="statemask">
          Waiting for the final matching {mode == 'Lend' ? 'deposit' : 'loan'} limit on the settlement date
        </div>
      ) : (
        <div>
          {mode == 'Lend' ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                {' '}
                <p className="access_token">{'SP-Token'}</p>
                {props.state == '4' ? (
                  <p className="access_num">{0}</p>
                ) : (
                  <p className="access_num">{hasNoClaim == false ? Math.floor(claimAmount * 100) / 100 : 0}</p>
                )}
              </div>

              <Button
                style={{
                  background: ' rgba(93, 82, 255, 0.1)',
                  border: '1px solid rgba(93, 82, 255, 0.5)',
                  borderRadius: '10px',
                  width: '134px',
                  height: '44px',
                  color: '#5D52FF',
                  lineHeight: '24px',
                  padding: '10px 24px',
                  fontSize: '16px',
                  fontWeight: 500,
                  boxSizing: 'border-box',
                }}
                onClick={() => getImporttoken(props.Sptoken)}
              >
                Add Token
              </Button>
            </div>
          ) : (
            <>
              <div style={{ display: 'inline-block' }}>
                <p className="access_token">Loan amount</p>
                <p className="access_num">
                  {Math.floor(
                    ((Number(dealNumber_18(props.borrowSupply)) * Number(props.borrowPrice)) /
                      Number(props.lendPrice) /
                      props.collateralization_ratio) *
                      10000,
                  ) / 100}{' '}
                  {props.poolname}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p className="access_token">{'JP-Token'}</p>
                  {props.state == '4' ? (
                    <p className="access_num">{0}</p>
                  ) : (
                    <p className="access_num">
                      {hasNoClaim == false ? Math.floor(claimAmountborrow * props.borrowPrice * 100) / 100 : 0}
                    </p>
                  )}
                </div>
                <Button
                  style={{
                    background: ' rgba(93, 82, 255, 0.1)',
                    border: '1px solid rgba(93, 82, 255, 0.5)',
                    borderRadius: '10px',
                    width: '134px',
                    height: '44px',
                    color: '#5D52FF',
                    lineHeight: '24px',
                    padding: '10px 24px',
                    fontSize: '16px',
                    fontWeight: 500,
                    boxSizing: 'border-box',
                  }}
                  onClick={() => getImporttoken(props.Jptoken)}
                >
                  Add Token
                </Button>
              </div>
            </>
          )}
        </div>
      )}
      <p className="access_list">
        <span className="access_key">Underlying Asset</span>
        <span className="access_value">{props.underlying_asset}</span>
      </p>
      <p className="access_list">
        <span className="access_key">settlement Date</span>
        <span className="access_value">{props.settlement_date}</span>
      </p>

      <Button
        style={{ marginTop: '40px' }}
        loading={loadings}
        onClick={() => {
          setloadings(true), accessClaim();
        }}
        disabled={
          props.state == '0' || props.state == '4'
            ? true
            : claimAmount == 0
            ? true
            : claimAmountborrow == 0
            ? true
            : hasNoClaim == true
            ? true
            : false
        }
      >
        Claim
      </Button>
    </div>
  );
};

AccessTab.defaultProps = {
  className: '',
  style: null,
};

export default AccessTab;
