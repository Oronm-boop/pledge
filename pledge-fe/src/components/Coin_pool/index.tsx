import React, { useState, useEffect } from 'react';
import classnames from 'classnames';

import { Progress, notification, Divider, Space } from 'antd';
import ConnectWallet from '_components/ConnectWallet';
import BUSD from '_src/assets/images/busd.png';
import BTCB from '_src/assets/images/btcb.png';
import USDT from '_assets/images/order_USDT.png';
import DAI from '_assets/images/order_DAI.png';
import ETH from '_assets/images/4023 2.png';
import BNB from '_assets/images/4023 3.png';
import { InputNumber, Steps, message, Button } from 'antd';
import services from '_src/services';
import { useRouteMatch, useHistory } from 'react-router-dom';
import moment from 'moment';
import { FORMAT_TIME_STANDARD } from '_src/utils/constants';
import img1 from '_src/assets/images/4023 1.png';
import JP from '_src/assets/images/Jp.png';
import SP from '_src/assets/images/Sp.png';
import Success from '_src/assets/images/Success.png';
import Error from '_src/assets/images/Error.png';
import icon3 from '_src/assets/images/icon (3).png';
import icon4 from '_src/assets/images/icon (4).png';
import Union from '_src/assets/images/union.png';
import LoadingSVG from '_src/assets/images/loading.svg';
import { HomeOutlined, SettingFilled, SmileOutlined, SyncOutlined, LoadingOutlined } from '@ant-design/icons';

import './index.less';
import Button1 from '_components/Button';
import { collectStoredAnnotations } from 'mobx/dist/internal';
import pageURL from '_constants/pageURL';
import { number } from 'prop-types';
import BigNumber from 'bignumber.js';
import { render } from 'react-dom';
import { use } from 'echarts';
import { web3 } from '_src/services/web3';
import { useActiveWeb3React } from '_src/hooks';

export interface ICoin_pool {
  mode: string;
  pool: string;
  coin: string;
}
type Iparams = {
  pid: string;
};
const Context = React.createContext({ name: 'Default' });
const Coin_pool: React.FC<ICoin_pool> = ({ mode, pool, coin }) => {
  const [data, setData] = useState(0);
  const [balance, setbalance] = useState('');
  const [balanceborrow, setbalanceborrow] = useState('');

  const [poolinfo, setpoolinfo] = useState({});
  const [borrowvalue, setborrowvalue] = useState(0);
  const [lendvalue, setlendvalue] = useState(0);
  const { connector, library, chainId, account } = useActiveWeb3React();
  const [loadings, setloadings] = useState(false);
  const [warning, setwarning] = useState('');
  const [price, setprice] = useState(0);
  const [accountbalance, setaccountbalance] = useState('');

  const { url: routeUrl, params } = useRouteMatch<Iparams>();
  const { pid } = params;
  // const [api, contextHolder] = notification.useNotification();

  const openNotification = (placement) => {
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
            <p style={{ margin: '0 9.4px 0 33px' }}>{'Approve success'}</p>{' '}
            <img src={icon3} alt="" style={{ width: '11.2px', height: '11.2px' }} />
          </div>
        </div>
      ),
    });
  };
  const openNotificationerror = (placement) => {
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
            <p style={{ margin: '0 9.4px 0 33px' }}>{'Approve error'}</p>{' '}
            <img src={icon4} alt="" style={{ width: '11.2px', height: '11.2px' }} />
          </div>
        </div>
      ),
    });
  };
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
            <p style={{ margin: '0 9.4px 0 33px' }}>{'Lend success'}</p>{' '}
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
            <p style={{ margin: '0 9.4px 0 33px' }}>{'Borrow success'}</p>{' '}
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
            <p style={{ margin: '0 9.4px 0 33px' }}>{'Lend error'}</p>{' '}
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
            <p style={{ margin: '0 9.4px 0 33px' }}>{'Borrow error'}</p>{' '}
            <img src={icon4} alt="" style={{ width: '11.2px', height: '11.2px' }} />
          </div>
        </div>
      ),
    });
  };

  const dealNumber = (num) => {
    if (num) {
      let x = new BigNumber(num);
      let y = new BigNumber(1e18);
      return x.multipliedBy(y).toFixed();
    }
  };

  const dealNumber_18 = (num) => {
    if (num) {
      let x = new BigNumber(num);
      let y = new BigNumber(1e18);
      return x.dividedBy(y).toFixed();
    }
  };
  const dealNumber_7 = (num) => {
    if (num) {
      return Math.floor(num * Math.pow(10, 7)) / Math.pow(10, 7);
    }
  };
  const dealNumber_8 = (num) => {
    if (num) {
      let x = new BigNumber(num);
      let y = new BigNumber(1e6);
      return x.dividedBy(y).toString();
    }
  };

  const getPoolInfo = async () => {
    const datainfo = await services.userServer.getpoolBaseInfo(chainId == undefined ? 56 : chainId).then((res) => {
      return res;
    });
    if (datainfo.data.code == 0) {
      const res = datainfo.data.data.map((item, index) => {
        let maxSupply = dealNumber_18(item.pool_data.maxSupply);
        let borrowSupply = dealNumber_18(item.pool_data.borrowSupply);
        let lendSupply = dealNumber_18(item.pool_data.lendSupply);
        const settlementdate = moment.unix(item.pool_data.settleTime).format(FORMAT_TIME_STANDARD);
        const maturitydate = moment.unix(item.pool_data.endTime).format(FORMAT_TIME_STANDARD);
        var difftime = item.pool_data.endTime - item.pool_data.settleTime;

        var days = parseInt(difftime / 86400 + '');
        console.log('state', item.pool_data.state);
        console.log(item.pool_data.autoLiquidateThreshold);
        return {
          key: index + 1,
          state: item.pool_data.state,
          underlying_asset: item.pool_data.borrowTokenInfo.tokenName,
          fixed_rate: dealNumber_8(item.pool_data.interestRate),
          maxSupply: maxSupply,
          available_to_lend: [borrowSupply, lendSupply],
          settlement_date: settlementdate,
          length: days,
          margin_ratio: `${100 + Number(dealNumber_8(item.pool_data.autoLiquidateThreshold))}%`,
          collateralization_ratio: dealNumber_8(item.pool_data.martgageRate),
          poolname: item.pool_data.lendTokenInfo.tokenName,
          endTime: item.pool_data.endTime,
          settleTime: item.pool_data.settleTime,
          maturity_date: maturitydate,
          logo: item.pool_data.borrowTokenInfo.tokenLogo,
          logo2: item.pool_data.lendTokenInfo.tokenLogo,
          Sp: item.pool_data.lendToken,
          Jp: item.pool_data.borrowToken,
          Sptoken: item.pool_data.spCoin,
          Jptoken: item.pool_data.jpCoin,
          borrowPrice: item.pool_data.borrowTokenInfo.tokenPrice,
          lendPrice: item.pool_data.lendTokenInfo.tokenPrice,
          borrowFee: dealNumber_8(item.pool_data.borrowTokenInfo.borrowFee),
          lendFee: dealNumber_8(item.pool_data.lendTokenInfo.lendFee),
        };
      });
      setpoolinfo(res);
    } else {
      return;
    }
  };
  console.log(poolinfo[pid]);
  const getaccountbalance = async () => {
    var balance = await web3.eth.getBalance(account);
    setaccountbalance(balance);
  };

  useEffect(() => {
    getPoolInfo();
    account && getaccountbalance();
    chainId !== undefined &&
      (services.ERC20Server.balanceOf(poolinfo[pid]?.Sp ?? 0)
        .then((res) => {
          setbalance(res);
        })
        .catch(() => console.error()),
      (poolinfo[pid]?.Jp ?? 0) !== '0x0000000000000000000000000000000000000000'
        ? services.ERC20Server.balanceOf(poolinfo[pid]?.Jp ?? 0)
            .then((res) => {
              setbalanceborrow(res);
            })
            .catch(() => console.error())
        : setbalanceborrow(accountbalance));
  }, [chainId]);
  useEffect(() => {
    chainId !== undefined &&
      (services.ERC20Server.balanceOf(poolinfo[pid]?.Sp ?? 0)
        .then((res) => {
          setbalance(res);
        })
        .catch(() => console.error()),
      (poolinfo[pid]?.Jp ?? 0) !== '0x0000000000000000000000000000000000000000'
        ? services.ERC20Server.balanceOf(poolinfo[pid]?.Jp ?? 0)
            .then((res) => {
              setbalanceborrow(res);
            })
            .catch(() => console.error())
        : setbalanceborrow(accountbalance));
  }, [poolinfo]);

  //每三位加一个小数点
  function toThousands(num) {
    var str = num.toString();
    var reg = str.indexOf('.') > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g;
    return str.replace(reg, '$1,');
  }

  function handleOnChange(value) {
    setlendvalue(value);
  }
  function handleOnChange2(value) {
    setData(value);
    setborrowvalue(
      ((value * Number(poolinfo[pid]?.borrowPrice ?? 0)) /
        Number(poolinfo[pid]?.lendPrice ?? 0) /
        (poolinfo[pid]?.collateralization_ratio ?? 0)) *
        100,
    );
  }
  function handleOnChange3(value) {
    setborrowvalue(value);
    setData(
      ((value / Number(poolinfo[pid]?.borrowPrice ?? 0)) *
        Number(poolinfo[pid]?.lendPrice ?? 0) *
        (poolinfo[pid]?.collateralization_ratio ?? 0)) /
        100,
    );
  }

  const { Step } = Steps;
  const steps = [
    {
      title: '1',
      content: 'First-content',
    },
    {
      title: '2',
      content: 'Second-content',
    },
  ];

  const [current, setCurrent] = React.useState(0);

  const next = () => {
    setCurrent(current + 1);
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  return (
    <div className="coin_pool">
      <div className="coin_pool_box">
        <div className="coin_pool_box_title">
          <img src={poolinfo[pid]?.logo2 ?? ''} style={{ width: '40px', height: '40px' }} /> <h3>{pool} Pool</h3>
        </div>
        <div className="coin_pool_box_info">
          <p className="info_title">
            <span>
              <span style={{ backgroundColor: '#FFA011' }}></span>
              Lending Amount
            </span>
            <span>
              <span style={{ backgroundColor: '#5D52FF' }}></span>Available To Lend
            </span>
            <span className="total_lend">
              <span style={{ backgroundColor: '#F5F5FA' }}></span>Total Lend
            </span>
          </p>

          <Progress
            percent={((poolinfo[pid]?.available_to_lend[1] ?? 0) / (poolinfo[pid]?.maxSupply ?? 0)) * 100}
            showInfo={false}
            strokeColor="#5D52FF"
            success={{
              percent:
                Math.floor(
                  (((poolinfo[pid]?.available_to_lend[0] ?? 0) * Number(poolinfo[pid]?.borrowPrice ?? 0)) /
                    Number(poolinfo[pid]?.lendPrice ?? 0) /
                    (poolinfo[pid]?.collateralization_ratio ?? 0)) *
                    10000,
                ) / Number(poolinfo[pid]?.maxSupply ?? 0),
            }}
          />
          <p style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>
              <span style={{ color: '#ffa011' }}>{`${toThousands(
                Math.floor(
                  (((poolinfo[pid]?.available_to_lend[0] ?? 0) * Number(poolinfo[pid]?.borrowPrice ?? 0)) /
                    Number(poolinfo[pid]?.lendPrice ?? 0) /
                    (poolinfo[pid]?.collateralization_ratio ?? 0)) *
                    10000,
                ) / 100,
              )}`}</span>
              /
              <span style={{ color: '#5D52FF' }}>{`${toThousands(
                Math.floor((poolinfo[pid]?.available_to_lend[1] ?? 0) * 100) / 100,
              )}`}</span>
            </span>
            <span>{toThousands(poolinfo[pid]?.maxSupply ?? 0)}</span>
          </p>
        </div>
        <div className="fixed">
          <p>
            <span className="info_title1_num">{`${poolinfo[pid]?.fixed_rate ?? 0} %`}</span>
            <span className="info_title1">Fixed Rate</span>
          </p>
          <p>
            <span className="info_title1_num">{poolinfo[pid]?.margin_ratio ?? 0}</span>
            <span className="info_title1">Margin Ratio</span>
          </p>
          <p>
            <span className="info_title1_num">{`${poolinfo[pid]?.collateralization_ratio ?? 0}%`}</span>
            <span className="info_title1">Collateralization Ratio</span>
          </p>
        </div>
        <p className="info_key">
          <span className="info_title">Underlying Asset</span>
          <span className="info_key_info">{coin}</span>
        </p>
        <p className="info_key">
          <span className="info_title">Collaterial In Escrow</span>
          <span className="info_key_info">
            {dealNumber_7(poolinfo[pid]?.available_to_lend[0] ?? 0)} {coin}
          </span>
        </p>
        <p className="info_key">
          <span className="info_title">Settlement date</span>
          <span className="info_key_info">{poolinfo[pid]?.settlement_date ?? ''}</span>
        </p>
        <p className="info_key">
          <span className="info_title">Maturity Date</span>{' '}
          <span className="info_key_info">{poolinfo[pid]?.maturity_date ?? 0}</span>
        </p>
      </div>

      <div className="coin_pool_box2">
        <div className="coin_pool_box2_title">
          <p className="info_title2">How much do you want to {mode == 'Lend' ? 'Lend' : 'Borrow'}?</p>
          {mode == 'Lend' ? (
            <>
              <div className="balance_input">
                <p style={{ fontWeight: 400 }}>
                  Balance: {balance && Math.floor(Number(dealNumber_18(balance)) * 1000000) / 1000000} {pool}
                </p>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <InputNumber
                    name="input1"
                    type="number"
                    value={lendvalue ? Math.floor(lendvalue * 10000000) / 10000000 : ''}
                    onChange={handleOnChange}
                    bordered={false}
                    style={{ width: '100%', fontSize: '24px' }}
                    placeholder="0.000....."
                  />
                  <div className="warning" style={{ width: '280px', marginLeft: '-400px', color: 'red' }}>
                    {warning}
                  </div>
                  <button
                    style={{
                      background: 'none',
                      borderRight: '2px solid rgb(230, 230, 235)',
                      borderLeft: 'none',
                      borderTop: 'none',
                      borderBottom: 'none',
                      paddingRight: '8px',
                      marginRight: '8px',
                      cursor: 'pointer',
                      zIndex: 1,
                    }}
                    onClick={() => handleOnChange(Number(dealNumber_18(balance)))}
                  >
                    <p
                      style={{
                        fontSize: '16px',
                        margin: '0 ',
                        color: '#5D52FF',
                        backgroundColor: 'rgba(93, 82, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '0 8px',
                        lineHeight: '28px',
                      }}
                    >
                      {' '}
                      Max
                    </p>
                  </button>
                  <div className="coin_pool_box_title" style={{ margin: '0' }}>
                    <img src={poolinfo[pid]?.logo2 ?? ''} alt="" style={{ width: '28px', height: '28px' }} />{' '}
                    <h3>{pool}</h3>
                  </div>
                </div>
              </div>
              <p
                style={{
                  paddingBottom: '28px',
                  marginBottom: '28px',
                  borderBottom: '1px dashed #E6E6EB',
                  fontWeight: 400,
                  color: '#4F4E66',
                }}
              >
                {/* Minimum deposit quantity{' '}
                <span style={{ color: '#5D52FF' }}>
                  {100} {pool}
                </span> */}
              </p>
            </>
          ) : (
            <>
              <div className="borrow_input">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <InputNumber
                    type="number"
                    name="input3"
                    value={borrowvalue ? Math.floor(borrowvalue * 10000000) / 10000000 : ''}
                    onChange={handleOnChange3}
                    bordered={false}
                    style={{ width: '100%', fontSize: '24px', paddingLeft: '18px' }}
                    placeholder="0.000....."
                  />
                  <div style={{ width: '280px', marginLeft: '-400px', color: 'red' }}>{warning}</div>
                  <div className="coin_pool_box_title">
                    <img src={poolinfo[pid]?.logo2 ?? ''} alt="" style={{ width: '28px', height: '28px' }} />{' '}
                    <h3>{pool}</h3>
                  </div>
                </div>
              </div>
              <p style={{ padding: '10px 0 32px', fontWeight: 400, color: '#4F4E66' }}>
                {/* Minimum deposit quantity{' '}
                <span style={{ color: '#5D52FF' }}>
                  {100} {pool}
                </span> */}
              </p>
              <p className="info_title2">How much collateral do you want to pledge?</p>
              <div style={{ marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px dashed #E6E6EB' }}>
                <div className="balance_input">
                  <p style={{ fontWeight: 400 }}>
                    Balance:{' '}
                    {(balanceborrow && Math.floor(Number(dealNumber_18(balanceborrow)) * 1000000) / 1000000) || 0}{' '}
                    {coin}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <InputNumber
                      type="number"
                      value={data ? Math.floor(data * 10000000) / 10000000 : ''}
                      name="input2"
                      onChange={handleOnChange2}
                      bordered={false}
                      style={{ width: '100%', fontSize: '24px' }}
                      placeholder="0.000....."
                    />
                    <button
                      style={{
                        background: 'none',
                        borderRight: '2px solid rgb(230, 230, 235)',
                        borderLeft: 'none',
                        borderTop: 'none',
                        borderBottom: 'none',
                        paddingRight: '8px',
                        marginRight: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        handleOnChange2(Number(dealNumber_18(balanceborrow)));
                      }}
                    >
                      <p
                        style={{
                          fontSize: '16px',
                          margin: '0 ',
                          color: '#5D52FF',
                          backgroundColor: 'rgba(93, 82, 255, 0.1)',
                          borderRadius: '10px',
                          padding: '0 8px',
                          lineHeight: '28px',
                        }}
                      >
                        {' '}
                        Max
                      </p>
                    </button>
                    <div className="coin_pool_box_title" style={{ margin: '0' }}>
                      <img src={poolinfo[pid]?.logo ?? ''} alt="" style={{ width: '28px', height: '28px' }} />{' '}
                      <h3>{coin}</h3>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <p className="info_key">
          <span className="info_title">Fee</span>{' '}
          <span className="info_key_info">
            {mode == 'Lend' ? `${poolinfo[pid]?.lendFee ?? 0}%` : `${poolinfo[pid]?.borrowFee ?? 0}%`}
          </span>
        </p>
        <p className="info_key">
          <span className="info_title">{mode == 'Lend' ? 'Sp-Token' : 'Jp-Token'}</span>{' '}
          <span className="info_key_info sp_jp">
            {mode == 'Lend' ? poolinfo[pid]?.Sptoken ?? 0 : poolinfo[pid]?.Jptoken ?? 0}
          </span>
        </p>
        <p className="info_key">
          <span className="info_title">Receive</span>{' '}
          <span className="info_key_info">
            {mode === 'Lend' ? (
              <img src={SP} alt="" style={{ width: '24px', marginRight: '8px' }} />
            ) : (
              <img src={JP} alt="" style={{ width: '24px', marginRight: '8px' }} />
            )}
            {borrowvalue
              ? Number(poolinfo[pid]?.collateralization_ratio / 100 ?? 0) * Number(borrowvalue.toFixed(2))
              : lendvalue
              ? Number(lendvalue.toFixed(2))
              : '0.00'}
            {'  '}
            {mode === 'Lend' ? 'SP-Token' : 'JP-Token'}
          </span>
        </p>
        <p className="info_key">
          <span className="info_title">Expected Interest</span>{' '}
          <span className="info_key_info">
            {borrowvalue
              ? ((((poolinfo[pid]?.fixed_rate ?? 0) / 100) * borrowvalue) / 365) *
                ((poolinfo[pid]?.length ?? 0) == 0 ? 1 : poolinfo[pid]?.length ?? 0)
              : lendvalue
              ? ((((poolinfo[pid]?.fixed_rate ?? 0) / 100) * lendvalue) / 365) *
                ((poolinfo[pid]?.length ?? 0) == 0 ? 1 : poolinfo[pid]?.length ?? 0)
              : '0.00'}{' '}
            {pool}
          </span>
        </p>

        {mode == 'Lend' ? (
          <div>
            <div
              className="steps-action"
              style={{ display: 'flex', justifyContent: 'space-between', margin: '42px 0 10px' }}
            >
              {current < steps.length - 1 && (
                <>
                  {chainId == undefined ? (
                    <ConnectWallet className="borrowwallet" />
                  ) : (
                    <Context.Provider value={{ name: 'Ant Design' }}>
                      <Button1
                        style={{ width: '48%', borderRadius: '15px' }}
                        loading={loadings}
                        onClick={async () => {
                          var currentTime = Math.round(new Date().getTime() / 1000).toString();
                          if ((poolinfo[pid]?.state ?? 0) > 2) {
                            return setwarning('The pool has finished');
                          } else if (lendvalue > (poolinfo[pid]?.maxSupply ?? 0)) {
                            return setwarning('Maximum exceeded');
                          } else if (currentTime > (poolinfo[pid]?.settleTime ?? 0)) {
                            return setwarning('Over time');
                          } else if (lendvalue > (balance && Number(dealNumber_18(balance)))) {
                            return setwarning('transfer amount exceeds balance');
                          } else if (
                            Number(lendvalue) + Number(poolinfo[pid]?.available_to_lend[1] ?? 0) >
                            Number(poolinfo[pid]?.maxSupply ?? 0)
                          ) {
                            return setwarning('Exceed limit');
                          }
                          setwarning('');
                          setloadings(true);
                          let num = dealNumber(lendvalue);
                          await services.ERC20Server.Approve(poolinfo[pid]?.Sp ?? 0, num, chainId)
                            .then(() => {
                              openNotification('Success');
                              setloadings(false);
                              next();
                            })
                            .catch(() => {
                              openNotificationerror('Error'), setloadings(false);
                            });

                          //授权的SPtoken
                          await services.ERC20Server.allowance(poolinfo[pid]?.Sp ?? 0, chainId).catch(() =>
                            console.error(),
                          );
                        }}
                        disabled={lendvalue == 0 || lendvalue == null ? true : false}
                      >
                        Approve
                      </Button1>
                    </Context.Provider>
                  )}
                  <Button1
                    style={{ width: '48%' }}
                    disabled={true}
                    onClick={() => message.success('Processing complete!')}
                  >
                    Lend
                  </Button1>
                </>
              )}
              {current === steps.length - 1 && (
                <>
                  <Button1 style={{ width: '48%', borderRadius: '15px' }} disabled={true} onClick={() => next()}>
                    Approve
                  </Button1>
                  <Button1
                    loading={loadings}
                    style={{ width: '48%', borderRadius: '15px' }}
                    onClick={async () => {
                      let num = dealNumber(lendvalue);
                      console.log(num, lendvalue);
                      var currentTime = Math.round(new Date().getTime() / 1000).toString();

                      if ((poolinfo[pid]?.state ?? 0) > 2) {
                        return setwarning('The pool has finished');
                      } else if (lendvalue > (poolinfo[pid]?.maxSupply ?? 0)) {
                        return setwarning('Maximum exceeded');
                      } else if (currentTime > (poolinfo[pid]?.settleTime ?? 0)) {
                        return setwarning('Over time');
                      } else if (lendvalue > (balance && Number(dealNumber_18(balance)))) {
                        return setwarning('transfer amount exceeds balance');
                      } else if (
                        Number(lendvalue) + Number(poolinfo[pid]?.available_to_lend[1] ?? 0) >
                        Number(poolinfo[pid]?.maxSupply ?? 0)
                      ) {
                        return setwarning('Exceed limit');
                      }
                      setloadings(true);
                      // //lend方法
                      console.log(poolinfo[pid]?.Jp ?? 0);
                      services.PoolServer.depositLend(pid, num, poolinfo[pid]?.Sp ?? 0, chainId)
                        .then(() => {
                          setloadings(false);
                          openNotificationlend('Success');
                          prev();
                          window.open(`${pageURL.Lend_Borrow.replace(':mode', `${mode}`)}`, '_self');
                        })
                        .catch(() => {
                          openNotificationerrorlend('Error'), setloadings(false);
                        });
                    }}
                  >
                    Lend
                  </Button1>
                </>
              )}
            </div>
            <Steps current={current} style={{ width: '60%', margin: '0 auto' }}>
              {steps.map((item) => (
                <Step key={item.title} title={item.title} />
              ))}
            </Steps>
            <div className="steps-content">{steps[current].content}</div>
          </div>
        ) : (
          <div>
            <div
              className="steps-action"
              style={{ display: 'flex', justifyContent: 'space-between', margin: '42px 0 10px' }}
            >
              {current < steps.length - 1 && (
                <>
                  {chainId == undefined ? (
                    <ConnectWallet className="borrowwallet" />
                  ) : (
                    <Button1
                      style={{ width: '48%', borderRadius: '15px' }}
                      loading={loadings}
                      onClick={async () => {
                        console.log(Math.round(data * Math.pow(10, 18)) / Math.pow(10, 18));

                        var currentTime = Math.round(new Date().getTime() / 1000).toString();
                        if (borrowvalue > (poolinfo[pid]?.maxSupply ?? 0)) {
                          return setwarning('Maximum exceeded');
                        } else if (currentTime > (poolinfo[pid]?.settleTime ?? 0)) {
                          return setwarning('Over time');
                        } else if (data > (balanceborrow && Number(dealNumber_18(balanceborrow)))) {
                          return setwarning('transfer amount exceeds balance');
                        }

                        setwarning('');
                        setloadings(true);

                        let borrownum = dealNumber(Math.round(data * Math.pow(10, 18)) / Math.pow(10, 18));
                        await services.ERC20Server.Approve(poolinfo[pid]?.Jp ?? 0, borrownum, chainId)
                          .then(() => {
                            openNotification('Success');
                            setloadings(false);
                            next();
                          })
                          .catch(() => {
                            openNotificationerror('Error'), setloadings(false);
                          });

                        // // // //授权的JPtoken
                        await services.ERC20Server.allowance(poolinfo[pid]?.Jp ?? 0, chainId)
                          .then((data) => {
                            console.log('授权' + data);
                          })
                          .catch(() => console.error());
                      }}
                      disabled={data == 0 || data == null ? true : false}
                    >
                      Approve
                    </Button1>
                  )}
                  <Button1
                    style={{ width: '48%' }}
                    disabled={true}
                    onClick={() => message.success('Processing complete!')}
                  >
                    Borrow
                  </Button1>
                </>
              )}

              {current === steps.length - 1 && (
                <>
                  <Button1 style={{ width: '48%', borderRadius: '15px' }} disabled={true} onClick={() => next()}>
                    Approve
                  </Button1>
                  <Button1
                    style={{ width: '48%', borderRadius: '15px' }}
                    loading={loadings}
                    onClick={async () => {
                      //  window.open(pageURL.Lend_Borrow.replace(':mode', `${mode}`));
                      setloadings(true);
                      var timestamp = Math.round(new Date().getTime() / 1000).toString();
                      console.log(timestamp);
                      if (borrowvalue > (poolinfo[pid]?.maxSupply ?? 0)) {
                        return setwarning('Maximum exceeded');
                      } else if (timestamp > (poolinfo[pid]?.settleTime ?? 0)) {
                        return setwarning('Over time');
                      } else if (data > (balanceborrow && Number(dealNumber_18(balanceborrow)))) {
                        return setwarning('transfer amount exceeds balance');
                      }

                      // // 授权
                      let borrownum = dealNumber(Math.floor(data * Math.pow(10, 18)) / Math.pow(10, 18));
                      console.log(borrownum);

                      //borrow方法
                      services.PoolServer.depositBorrow(pid, borrownum, timestamp, poolinfo[pid]?.Jp ?? 0, chainId)
                        .then(() => {
                          openNotificationborrow('Success');
                          setloadings(false);
                          prev();
                          window.open(`${pageURL.Lend_Borrow.replace(':mode', `${mode}`)}`, '_self');
                        })
                        .catch(() => {
                          openNotificationerrorborrow('Error'), setloadings(false);
                        });
                    }}
                  >
                    Borrow
                  </Button1>
                </>
              )}
            </div>
            <Steps current={current} style={{ width: '60%', margin: '0 auto' }}>
              {steps.map((item) => (
                <Step key={item.title} title={item.title} />
              ))}
            </Steps>
            <div className="steps-content">{steps[current].content}</div>
          </div>
        )}
      </div>
    </div>
  );
};

Coin_pool.defaultProps = {};

export default Coin_pool;
