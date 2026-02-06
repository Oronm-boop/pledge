import React, { useEffect, useState } from 'react';
import { useRouteMatch, useHistory } from 'react-router-dom';

import { Tooltip, Button, Empty } from 'antd';
import Button1 from '_components/Button';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { DappLayout } from '_src/Layout';
import PortfolioList from '_components/PortfolioList';
import AccessTab from '_components/AccessTab';
import Refund from '_components/Refund';
import services from '_src/services';
import { FORMAT_TIME_STANDARD } from '_src/utils/constants';
import moment from 'moment';
import BigNumber from 'bignumber.js';
import Defaultpage from '_components/Defaultpage';
import pageURL from '_constants/pageURL';
import TestnetTokens from '_components/TestnetTokens';

import './index.less';
import { useActiveWeb3React } from '_src/hooks';

type Iparams = {
  mode: 'Lend' | 'Borrow' | 'Provide';
};
function Market_Mode() {
  const { connector, library, chainId, account, activate, deactivate, active, error } = useActiveWeb3React();

  const history = useHistory();
  const { url: routeUrl, params } = useRouteMatch<Iparams>();
  const { mode } = params;

  const [datalend, setdatalend] = useState([]);
  const [databorrow, setdataborrow] = useState([]);
  const [datastate, setdatastate] = useState([]);
  const [datainfo1, setdatainfo1] = useState([]);
  const [pidlend, setpidlend] = useState([]);
  const [pidborrow, setpidborrow] = useState([]);

  const dealNumber_18 = (num) => {
    if (num) {
      let x = new BigNumber(num);
      let y = new BigNumber(1e18);
      return Math.floor(Number(x.dividedBy(y)) * Math.pow(10, 7)) / Math.pow(10, 7);
    }
  };
  const dealNumber_8 = (num) => {
    if (num) {
      let x = new BigNumber(num);
      let y = new BigNumber(1e6);
      return x.dividedBy(y).toString();
    }
  };
  const getData = () => {
    if (!chainId) return;
    services.userServer
      .getpoolDataInfo(chainId)
      .then((res) => {
        console.log(res.data.data);
        setdatainfo1(res.data.data);
      })
      .catch(() => console.error());
  };
  let [time, settime] = useState(0);
  const getPoolInfo = async () => {
    if (!chainId) return;
    const datainfo = await services.userServer.getpoolBaseInfo(chainId);
    const res = datainfo.data.data.map((item, index) => {
      let maxSupply = dealNumber_18(item.pool_data.maxSupply);
      let borrowSupply = dealNumber_18(item.pool_data.borrowSupply);
      let lendSupply = dealNumber_18(item.pool_data.lendSupply);

      const settlementdate = moment.unix(item.pool_data.settleTime).format(FORMAT_TIME_STANDARD);

      var difftime = item.pool_data.endTime - item.pool_data.settleTime;

      var days = parseInt(difftime / 86400 + '');
      return {
        key: index + 1,
        state: item.pool_data.state,
        underlying_asset: item.pool_data.borrowTokenInfo.tokenName,
        fixed_rate: dealNumber_8(item.pool_data.interestRate),
        maxSupply: maxSupply,
        available_to_lend: [borrowSupply, lendSupply],
        settlement_date: settlementdate,
        length: days,
        margin_ratio: dealNumber_8(item.pool_data.autoLiquidateThreshold),
        collateralization_ratio: dealNumber_8(item.pool_data.martgageRate),
        poolname: item.pool_data.lendTokenInfo.tokenName,
        Sp: item.pool_data.lendToken,
        Jp: item.pool_data.borrowToken,
        endtime: item.pool_data.endTime,
        lendSupply: item.pool_data.lendSupply,
        borrowSupply: item.pool_data.borrowSupply,
        Sptoken: item.pool_data.spCoin,
        Jptoken: item.pool_data.jpCoin,
        logo: item.pool_data.borrowTokenInfo.tokenLogo,
        logo2: item.pool_data.lendTokenInfo.tokenLogo,
        borrowPrice: dealNumber_8(item.pool_data.borrowTokenInfo.tokenPrice / 100),
        lendPrice: dealNumber_8(item.pool_data.lendTokenInfo.tokenPrice / 100),
      };
    });

    res.map((item, index) => {
      services.PoolServer.getuserLendInfo((Number(item.key) - 1).toString(), chainId)
        .then((res1) => {
          console.log(444, res1);
          res1.stakeAmount == '0' ? console.log(1111111) : pidlend.push(item);
          setdatalend(pidlend);
        })
        .catch(() => console.error());
      services.PoolServer.getuserBorrowInfo((Number(item.key) - 1).toString(), chainId)
        .then((res) => {
          res.stakeAmount == '0' ? console.log(1111111) : pidborrow.push(item);
          setdataborrow(pidborrow);
        })
        .catch(() => console.error());
    });

    let timetimer = setTimeout(() => {
      settime((time += 1));
      clearTimeout(timetimer);
    }, 1000);
    console.error(res);

    setdatastate(res);
  };
  useEffect(() => {
    return () => {
      mode == 'Lend' ? setpidborrow([]) : setpidlend([]);
    };
  }, []);
  useEffect(() => {
    if (!['Lend', 'Borrow', 'Provide'].includes(mode)) {
      history.push(pageURL.Dapp);
    }
    getData();
    getPoolInfo().catch(() => {
      console.error();
    });
  }, [chainId]);

  const LendTitle = [
    'Pool / Underlying Asset',
    'Total Lend Amount',
    'Total Borrow Amount',
    'Quantity Deposit',
    'Refund Deposit',
    'Extract The Refund',
  ];
  const BorrowTitle = [
    'Pool / Underlying Asset',
    'Total Lend Amount',
    'Total Borrow Amount',
    'Quantity Borrow',
    'Refund Borrow',
    'Extract The Refund',
  ];
  const PortfolioListTitle1 = ['Pool / Underlying Asset', 'Fixed Rate', 'State'];
  const PortfolioListTitle = [
    'Pool / Underlying Asset',
    'Fixed Rate',
    'State',
    'Settlement Date',
    'Margin Ratio',
    'Collateralization Ratio',
  ];

  return (
    <>
      {mode !== 'Provide' ? (
        (mode == 'Lend' ? datalend.length == 0 : databorrow.length == 0) ? (
          <Defaultpage mode={mode} />
        ) : (
          <DappLayout title={`${mode} Order`} className="dapp_mode_page">
            <p style={{ display: 'none' }}>{time}</p>
            <p className="prtfolioList_title">
              {PortfolioListTitle.map((item, index) => {
                return (
                  <span className="all_tab" key={index}>
                    {item}
                  </span>
                );
              })}
              {PortfolioListTitle1.map((item, index) => {
                return (
                  <span className="media_tab" key={index}>
                    {item}
                  </span>
                );
              })}
            </p>

            {datainfo1 &&
              datainfo1.length &&
              datastate.length &&
              (mode == 'Lend'
                ? datalend.map((item, index) => {
                    return <PortfolioList mode={mode} props={item} key={index} datainfo={datainfo1[item.key - 1]} />;
                  })
                : databorrow.map((item, index) => {
                    return <PortfolioList mode={mode} props={item} key={index} datainfo={datainfo1[item.key - 1]} />;
                  }))}

            <div style={{ display: 'flex', alignItems: 'center', marginTop: '64px' }}>
              <h3>Access to {mode == 'Borrow' ? 'Borrowing' : 'Lending'}</h3>
              <Tooltip placement="top" title={'Access to Borrowing'}>
                <QuestionCircleOutlined style={{ color: '#0A0B11' }} />
              </Tooltip>
            </div>
            <div className="access">
              {datainfo1 &&
                datainfo1.length &&
                datastate.length &&
                (mode == 'Lend'
                  ? datalend.map((item, index) => {
                      return <AccessTab mode={mode} props={item} key={index} stateinfo={datainfo1[item.key - 1]} />;
                    })
                  : databorrow.map((item, index) => {
                      return <AccessTab mode={mode} props={item} key={index} stateinfo={datainfo1[item.key - 1]} />;
                    }))}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '64px' }}>
                <h3>{mode == 'Lend' ? 'Refund Deposit' : 'Refund Borrow'}</h3>
                <Tooltip placement="top" title={mode == 'Lend' ? 'Refund Deposit' : 'Refund Borrow'}>
                  <QuestionCircleOutlined style={{ color: '#0A0B11' }} />
                </Tooltip>
              </div>
              <p className="prtfolioList_title">
                {mode == 'Lend'
                  ? LendTitle.map((item, index) => {
                      return (
                        <span className="all_tab" key={index}>
                          {item}
                        </span>
                      );
                    })
                  : BorrowTitle.map((item, index) => {
                      return (
                        <span className="all_tab" key={index}>
                          {item}
                        </span>
                      );
                    })}
              </p>

              {datainfo1 &&
                datainfo1.length &&
                datastate.length &&
                (mode == 'Lend'
                  ? datalend.map((item, index) => {
                      return <Refund mode={mode} props={item} key={index} stateinfo={datainfo1[item.key - 1]} />;
                    })
                  : databorrow.map((item, index) => {
                      return <Refund mode={mode} props={item} key={index} stateinfo={datainfo1[item.key - 1]} />;
                    }))}
            </div>
          </DappLayout>
        )
      ) : (
        <TestnetTokens mode={mode} props={datainfo1} />
      )}
    </>
  );
}

export default Market_Mode;
