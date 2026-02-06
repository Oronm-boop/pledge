import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

import { Collapse, Statistic, Row, Col, Table, Steps, message } from 'antd';
import BigNumber from 'bignumber.js';
import Button from '_components/Button';
import OrderImg from '_components/OrderImg';
import ClaimTime from '_components/ClaimTime';
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core';

import './index.less';
import services from '_src/services';
import { useActiveWeb3React } from '_src/hooks';

export interface IPortfolioList {
  props?: any;
  datainfo?: any;
  className?: string;
  style?: React.CSSProperties;
  mode: string;
}

const PortfolioList: React.FC<IPortfolioList> = ({ className, mode, datainfo, ...props }) => {
  const { connector, library, chainId, account, activate, deactivate, active, error } = useActiveWeb3React();
  const { Panel } = Collapse;
  const [stakeAmount, setstakeAmount] = useState('');
  const [stakeAmountborrow, setstakeAmountborrow] = useState('');

  const PoolState = { 0: 'match', 1: 'running', 2: 'expired', 3: 'liquidation', 4: 'undone' };

  const dealNumber_7 = (num) => {
    if (num) {
      let x = new BigNumber(num);
      let y = new BigNumber(1e18);
      return Math.floor(Number(x.dividedBy(y)) * Math.pow(10, 7)) / Math.pow(10, 7);
    }
  };
  const dealNumber_18 = (num) => {
    if (num) {
      let x = new BigNumber(num);
      let y = new BigNumber(1e18);
      return x.dividedBy(y).toFixed();
    }
  };
  const getBalance = () => {
    {
      services.PoolServer.getuserLendInfo((props.props.key - 1).toString(), chainId).then((data) => {
        setstakeAmount(data.stakeAmount);
      });
      services.PoolServer.getuserBorrowInfo((props.props.key - 1).toString(), chainId).then((data) => {
        setstakeAmountborrow(data.stakeAmount);
      });
    }
  };

  const claimAmount =
    Number(dealNumber_18(props.props.lendSupply)) !== 0
      ? Number(dealNumber_18(datainfo.pool_data.settleAmountLend)) *
        (Number(dealNumber_18(stakeAmount)) / Number(dealNumber_18(props.props.lendSupply)))
      : 0;
  const claimAmountborrow =
    Number(dealNumber_18(props.props.borrowSupply)) !== 0
      ? Number(dealNumber_18(datainfo.pool_data.settleAmountBorrow)) *
        (Number(dealNumber_18(stakeAmountborrow)) / Number(dealNumber_18(props.props.borrowSupply)))
      : 0;

  useEffect(() => {
    getBalance();
  });
  useEffect(() => {}, []);

  const expectedInterest =
    mode == 'Lend'
      ? ((Number(
          dealNumber_7(
            props.props.state < '2' ? datainfo.pool_data.settleAmountLend : datainfo.pool_data.finishAmountLend,
          ),
        ) *
          Number(props.props.fixed_rate)) /
          100 /
          365) *
        props.props.length
      : ((Number(
          dealNumber_7(
            props.props.state < '2' ? datainfo.pool_data.settleAmountBorrow : datainfo.pool_data.finishAmountBorrow,
          ),
        ) *
          Number(props.props.fixed_rate)) /
          100 /
          365) *
        props.props.length;

  const DetailList = [
    {
      //利息 = 本金*fixed rate/365 * length（天数）
      title: 'Detail',
      Total_financing: `${
        mode == 'Lend'
          ? dealNumber_7(props.props.lendSupply) == undefined
            ? 0
            : dealNumber_7(props.props.lendSupply)
          : dealNumber_7(
              ((props.props.borrowSupply * props.props.borrowPrice) /
                props.props.lendPrice /
                props.props.collateralization_ratio) *
                100,
            ) == undefined
          ? 0
          : dealNumber_7(
              ((props.props.borrowSupply * props.props.borrowPrice) /
                props.props.lendPrice /
                props.props.collateralization_ratio) *
                100,
            )
      }
${props.props.poolname} `,
      Pledge: `${dealNumber_7(props.props.borrowSupply)}${props.props.underlying_asset}`,
      Time: `${props.props.settlement_date}`,
      Collateral_Amount: `${dealNumber_7(Number(stakeAmountborrow))} ${props.props.underlying_asset}`,
      Deposit_Amount: `${dealNumber_7(Number(stakeAmount))} ${props.props.poolname}`,
    },
  ];
  return (
    <div className={classNames('portfolio_list', className)} {...props}>
      <Collapse bordered={false} expandIconPosition="right" ghost={true}>
        <Panel
          header={
            <Row gutter={16} style={{ width: '100%' }}>
              <Col span={4}>
                <OrderImg img1={props.props.logo2} img2={props.props.logo} />
                <Statistic title={`${props.props.poolname}/${props.props.underlying_asset}`} />
              </Col>
              <Col span={4}>
                <Statistic title={`${props.props.fixed_rate} %`} />
              </Col>
              <Col span={4}>
                <Statistic title={PoolState[props.props.state]} />
              </Col>
              <Col span={4} className="media_tab">
                <Statistic title={props.props.settlement_date} />
              </Col>
              <Col span={4} className="media_tab">
                <Statistic title={`${Number(props.props.margin_ratio) + 100}%`} />
              </Col>
              <Col span={4} className="media_tab">
                <Statistic title={`${props.props.collateralization_ratio}%`} />
              </Col>
            </Row>
          }
          key={props.props.key}
        >
          <div className="order_box">
            {DetailList.map((item, index) => {
              return (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <>
                    <ul className="order_list">
                      <p>{item.title}</p>
                      <ul className="medialist">
                        <li>
                          <span>Margin Ratio</span>
                          <span>{`${Number(props.props.margin_ratio) + 100}%`}</span>
                        </li>
                        <li>
                          <span>Collateralization Ratio</span>
                          <span>{`${props.props.collateralization_ratio}%`}</span>
                        </li>
                        <li>
                          <span>Settlement Date</span>
                          <span>{props.props.settlement_date}</span>
                        </li>
                      </ul>
                      <li>
                        <span>Total Lend</span> <span>{item.Total_financing}</span>
                      </li>

                      {mode == 'Lend' ? (
                        <li>
                          <span>Deposit Amount</span>
                          <span>{item.Deposit_Amount}</span>
                        </li>
                      ) : (
                        <li>
                          <span>Collateral Amount</span>
                          <span>{item.Collateral_Amount}</span>
                        </li>
                      )}
                      <li>
                        <span>Maturity Date</span> <span>{item.Time}</span>
                      </li>
                    </ul>

                    {props.props.state != 0 && props.props.state != 1 && props.props.state != 4 && (
                      <div className="Reward">
                        <p>Reward</p>
                        <div className="rewardinfo">
                          <div className="rewardtab">
                            <p className="rewardkey">
                              {mode == 'Lend' ? 'The principal+interest' : 'Remaining Collateral'}
                            </p>

                            {props.props.state == '3' ? (
                              <p className="rewardvalue">
                                {mode == 'Lend'
                                  ? `${
                                      Math.floor(
                                        (claimAmount / Number(dealNumber_18(datainfo.pool_data.settleAmountLend))) *
                                          Number(dealNumber_18(datainfo.pool_data.liquidationAmounLend)) *
                                          10000000,
                                      ) / 10000000
                                    }  ${props.props.poolname}`
                                  : `${
                                      Math.floor(
                                        (claimAmountborrow /
                                          Number(dealNumber_18(datainfo.pool_data.settleAmountBorrow))) *
                                          Number(dealNumber_18(datainfo.pool_data.liquidationAmounBorrow)) *
                                          10000000,
                                      ) / 10000000
                                    }
                                ${props.props.underlying_asset}`}
                              </p>
                            ) : (
                              <p className="rewardvalue">
                                {mode == 'Lend'
                                  ? `${
                                      Math.floor(
                                        (claimAmount / Number(dealNumber_18(datainfo.pool_data.settleAmountLend))) *
                                          Number(dealNumber_18(datainfo.pool_data.finishAmountLend)) *
                                          10000000,
                                      ) / 10000000
                                    }  ${props.props.poolname}`
                                  : `${
                                      Math.floor(
                                        (claimAmountborrow /
                                          Number(dealNumber_18(datainfo.pool_data.settleAmountBorrow))) *
                                          Number(dealNumber_18(datainfo.pool_data.finishAmountBorrow)) *
                                          10000000,
                                      ) / 10000000
                                    }
                                   ${props.props.underlying_asset}`}
                              </p>
                            )}
                          </div>
                          {console.log(
                            Math.floor(
                              (claimAmountborrow / Number(dealNumber_18(datainfo.pool_data.settleAmountBorrow))) *
                                Number(dealNumber_18(datainfo.pool_data.finishAmountBorrow)) *
                                10000000,
                            ) / 10000000,
                          )}
                          <ClaimTime
                            endtime={props.props.endtime}
                            state={props.props.state}
                            pid={props.props.key - 1}
                            value={datainfo.pool_data.finishAmountLend}
                            mode={mode}
                            settlementAmountLend={datainfo.pool_data.settleAmountLend}
                            spToken={props.props.Sptoken}
                            jpToken={props.props.Jptoken}
                          />
                        </div>
                      </div>
                    )}
                  </>
                </div>
              );
            })}
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

PortfolioList.defaultProps = {
  className: '',
  style: null,
};
export default PortfolioList;
