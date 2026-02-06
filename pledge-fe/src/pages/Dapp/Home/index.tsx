import React, { useEffect, useState } from 'react';
import { useRouteMatch, useHistory } from 'react-router-dom';
import { Tabs, Table, Progress, Popover, Menu, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useWeb3React, UnsupportedChainIdError } from '@web3-react/core';
import { InjectedConnector } from '@web3-react/injected-connector';

import moment from 'moment';
import { FORMAT_TIME_STANDARD } from '_src/utils/constants';
import { DappLayout } from '_src/Layout';
import { Link } from 'react-router-dom';
import PageUrl from '_constants/pageURL';
import BTCB from '_src/assets/images/order_BTCB.png';
import BNB from '_src/assets/images/order_BNB.png';
import BUSD from '_src/assets/images/order_BUSD.png';
import DAI from '_src/assets/images/order_DAI.png';
import Lender1 from '_src/assets/images/Group 1843.png';
import Borrower from '_src/assets/images/Group 1842.png';
import Close from '_assets/images/Close Square.png';
import RootStore from '_src/stores/index';

import './index.less';
import Button from '_components/Button';
import services from '_src/services';
import BigNumber from 'bignumber.js';

function HomePage() {
  const history = useHistory();
  const { connector, library, chainId, account } = useWeb3React();
  const { testStore } = RootStore;
  const [pid, setpid] = useState(0);
  const { TabPane } = Tabs;
  const [tab, settab] = useState('Live');
  const [price, setprice] = useState(0);
  const [pool, setpool] = useState('BUSD');
  const [coin, setcoin] = useState('');
  const [visible, setvisible] = useState(false);
  const [show, setshow] = useState('100');
  const [data, setdata] = useState([]);
  const [datastate, setdatastate] = useState([]);
  const [Id, setId] = useState(56);

  const dealNumber_18 = (num) => {
    if (num) {
      let x = new BigNumber(num);
      let y = new BigNumber(1e18);
      return x.dividedBy(y).toFixed();
    }
  };

  const dealNumber_8 = (num) => {
    if (num) {
      let x = new BigNumber(num);
      let y = new BigNumber(1e6);
      return x.dividedBy(y).toString();
    }
  };
  const getPoolInfo = async (chainId) => {
    const datainfo = await services.userServer.getpoolBaseInfo(chainId);

    const res = datainfo.data.data.map((item, index) => {
      let maxSupply = dealNumber_18(item.pool_data.maxSupply);
      let borrowSupply = dealNumber_18(item.pool_data.borrowSupply);
      let lendSupply = dealNumber_18(item.pool_data.lendSupply);

      const times = moment.unix(item.pool_data.settleTime).format(FORMAT_TIME_STANDARD);

      var difftime = item.pool_data.endTime - item.pool_data.settleTime;

      var days = parseInt(difftime / 86400 + '');
      return {
        key: index + 1,
        state: item.pool_data.state,
        underlying_asset: item.pool_data.borrowTokenInfo.tokenName,
        fixed_rate: dealNumber_8(item.pool_data.interestRate),
        maxSupply: maxSupply,
        available_to_lend: [borrowSupply, lendSupply],
        settlement_date: times,
        length: days,
        margin_ratio: dealNumber_8(item.pool_data.autoLiquidateThreshold),
        collateralization_ratio: dealNumber_8(item.pool_data.martgageRate),
        poolname: item.pool_data.lendTokenInfo.tokenName,
        endTime: item.pool_data.endTime,
        settleTime: item.pool_data.settleTime,
        logo: item.pool_data.borrowTokenInfo.tokenLogo,
        Sp: item.pool_data.lendToken,
        Jp: item.pool_data.borrowToken,
        borrowPrice: item.pool_data.borrowTokenInfo.tokenPrice,
        lendPrice: item.pool_data.lendTokenInfo.tokenPrice,
      };
    });
    setdata(res);

    setdatastate(
      res.filter((item) => {
        return item.state < 1;
      }),
    );
  };

  useEffect(() => {
    history.push('BUSD');
  }, []);
  useEffect(() => {
    setTimeout(() => {
      setId(chainId);
      getPoolInfo(Id == undefined ? 56 : Id).catch(() => {
        console.error();
      });
    }, 1000);
  }, [Id]);

  // useEffect(() => {
  //   getPoolInfo(chainId).catch(() => {
  //     console.error();
  //   });
  // }, [chainId]);
  const callback = (key) => {
    history.push(key);
    setpool(key);
  };
  const handleVisibleChange = (visable, num) => {
    if (visable) {
      setshow(num);
      setvisible(visable);
    }
  };
  const menu = (
    <Menu>
      <Menu.Item>
        <p
          className="menutab"
          onClick={() => {
            const livelist = data.filter((item) => {
              return item.state < 1;
            });
            settab('Live');
            setdatastate(data);
            setdatastate(livelist);
          }}
        >
          Live
        </p>
      </Menu.Item>
      <Menu.Item>
        <p
          className="menutab"
          onClick={() => {
            const livelist = data.filter((item) => {
              return item;
            });
            settab('All');
            setdatastate(data);
            setdatastate(livelist);
          }}
        >
          All
        </p>
      </Menu.Item>

      <Menu.Item>
        <p
          className="menutab"
          onClick={() => {
            const livelist = data.filter((item) => {
              return item.state >= 1;
            });
            settab('Finished');
            setdatastate(data);
            setdatastate(livelist);
          }}
        >
          Finished
        </p>
      </Menu.Item>
    </Menu>
  );
  //每三位加一个小数点
  function toThousands(num) {
    var str = num.toString();
    var reg = str.indexOf('.') > -1 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(?:\d{3})+$)/g;
    return str.replace(reg, '$1,');
  }

  const columns = [
    {
      title: 'Underlying Asset',
      dataIndex: 'underlying_asset',
      render: (val, record) => {
        return (
          <div className="underlyingAsset">
            <img src={record.logo} alt="" />
            <p>{val}</p>
          </div>
        );
      },
    },

    {
      title: 'Fixed Rate',
      dataIndex: 'fixed_rate',
      sorter: {
        compare: (a, b) => a.fixed_rate - b.fixed_rate,
        multiple: 3,
      },
      render: (val, record) => {
        return <div>{`${val}%`}</div>;
      },
    },
    {
      title: 'Available To Lend',
      dataIndex: 'available_to_lend',
      render: (val, record) => {
        var totalFinancing = (val[1] / record.maxSupply) * 100;
        return (
          <div className="totalFinancing">
            <Progress
              percent={totalFinancing}
              showInfo={false}
              strokeColor="#5D52FF"
              success={{
                percent:
                  Math.floor(
                    ((val[0] * record.borrowPrice) / record.lendPrice / record.collateralization_ratio) * 10000,
                  ) / record.maxSupply,
              }}
            />

            <p style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                <span style={{ color: '#FFA011', fontSize: '12px' }}>
                  {toThousands(
                    Math.floor(
                      ((val[0] * Number(record.borrowPrice)) /
                        Number(record.lendPrice) /
                        record.collateralization_ratio) *
                        10000,
                    ) / 100,
                  )}
                </span>
                /
                <span style={{ color: '#5D52FF', fontSize: '12px' }}>{`${toThousands(
                  Math.floor(val[1] * 100) / 100,
                )}`}</span>
              </span>
              <span style={{ width: '10px' }}></span>
              <span style={{ fontSize: '12px' }}>{toThousands(Number(record.maxSupply))}</span>
            </p>
          </div>
        );
      },
      sorter: {
        compare: (a, b) => a.total_financing - b.total_financing,
        multiple: 2,
      },
    },
    {
      title: 'Settlement Date',
      dataIndex: 'settlement_date',
      sorter: {
        compare: (a, b) => a.settleTime - b.settleTime,
        multiple: 1,
      },
    },
    {
      title: 'Length',
      dataIndex: 'length',
      sorter: {
        compare: (a, b) => a.length - b.length,
        multiple: 5,
      },
      render: (val, record) => {
        return <div>{`${val} day`}</div>;
      },
    },
    {
      title: 'Margin Ratio',
      dataIndex: 'margin_ratio',
      sorter: {
        compare: (a, b) => a.margin_ratio - b.margin_ratio,
        multiple: 6,
      },
      render: (val, record) => {
        return `${Number(val) + 100}%`;
      },
    },
    {
      title: 'Collateralization Ratio',
      dataIndex: 'collateralization_ratio',
      render: (val, record) => {
        return (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {`${val}%`}
            <Popover
              content={content}
              title="Choose a Role"
              trigger="click"
              visible={show === record.key && visible}
              onVisibleChange={(e) => handleVisibleChange(e, record.key)}
            >
              <Button
                style={{ width: '107px', height: '40px', borderRadius: '15px', lineHeight: '40px', color: '#FFF' }}
                onClick={() => {
                  setcoin(record.underlying_asset);
                  setshow(record.key);
                  setpid(record.key - 1);
                }}
              >
                Detail
              </Button>
            </Popover>
          </div>
        );
      },
      sorter: {
        compare: (a, b) => a.collateralization_ratio - b.collateralization_ratio,
        multiple: 7,
      },
    },
  ];
  const columns1 = [
    {
      title: 'Underlying Asset',
      dataIndex: 'underlying_asset',
      render: (val, record) => {
        return (
          <Popover
            content={content}
            title="Choose a Role"
            trigger="click"
            visible={show === record.key && visible}
            onVisibleChange={(e) => handleVisibleChange(e, record.key)}
          >
            <div
              className="underlyingAsset"
              onClick={() => {
                Changecoin(val), setcoin(record.underlying_asset);
                setshow(record.key);
                setpid(record.key - 1);
              }}
            >
              <img src={record.logo} alt="" />
              <p>{val}</p>
            </div>
          </Popover>
        );
      },
    },

    {
      title: 'Fixed Rate',
      dataIndex: 'fixed_rate',
      sorter: {
        compare: (a, b) => a.fixed_rate - b.fixed_rate,
        multiple: 3,
      },
      render: (val, record) => {
        return <div>{`${val}%`}</div>;
      },
    },

    {
      title: 'Settlement Date',
      dataIndex: 'settlement_date',
      sorter: {
        compare: (a, b) => a.settleTime - b.settleTime,
        multiple: 1,
      },
    },
  ];

  function onChange(pagination, filters, sorter, extra) {
    console.log('params', pagination, filters, sorter, extra);
  }
  const Changecoin = (val) => {
    setcoin(val);
  };

  const content = (
    <div className="choose">
      <Link
        to={PageUrl.Market_Pool.replace(':pid/:pool/:coin/:mode', `${pid}/${pool}/${coin}/Lender`)}
        style={{ color: '#FFF' }}
      >
        <div className="choose_lender">
          <img src={Lender1} alt="" />
          <p>
            <span>Lender</span> <span> Lock in a fixed interest rate today. Fixed rates guarantee your APY.</span>
          </p>
        </div>
      </Link>
      <Link
        to={PageUrl.Market_Pool.replace(':pid/:pool/:coin/:mode', `${pid}/${pool}/${coin}/Borrower`)}
        style={{ color: '#FFF' }}
      >
        <div className="choose_borrow">
          <img src={Borrower} alt="" />
          <p>
            <span>Borrower</span> <span>Borrow with certainty. Fixed rates lock in what you pay.</span>
          </p>
        </div>
      </Link>
      <img
        src={Close}
        alt=""
        className="close"
        onClick={() => {
          setvisible(false);
          setshow('100');
        }}
      />
    </div>
  );
  return (
    <div className="dapp_home_page">
      <DappLayout title="Market Pool" className="trust_code">
        <Dropdown overlay={menu} trigger={['click']} className="dropdown">
          <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
            {tab}
            <DownOutlined />
          </a>
        </Dropdown>
        <Tabs defaultActiveKey="1" onChange={callback} className="all_tab">
          <TabPane tab="BUSD" key="BUSD">
            <Table
              pagination={
                datastate.filter((item, index) => {
                  return (
                    item.Sp == '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' ||
                    item.Sp == '0xE676Dcd74f44023b95E0E2C6436C97991A7497DA'
                  );
                }).length < 10
                  ? false
                  : {}
              }
              columns={columns}
              dataSource={datastate.filter((item, index) => {
                return (
                  item.Sp == '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' ||
                  item.Sp == '0xE676Dcd74f44023b95E0E2C6436C97991A7497DA'
                );
              })}
              onChange={onChange}
              rowClassName={(record, index) => {
                return record;
              }}
            />
          </TabPane>
          <TabPane tab="USDT" key="USDT">
            <Table
              pagination={
                datastate.filter((item, index) => {
                  return item.Sp == '';
                }).length < 10
                  ? false
                  : {}
              }
              columns={columns}
              dataSource={datastate.filter((item, index) => {
                return item.Sp == '';
              })}
              onChange={onChange}
              rowClassName={(record, index) => {
                return record;
              }}
            />
          </TabPane>
          {chainId == 97 ? (
            <TabPane tab="DAI" key="DAI">
              <Table
                pagination={
                  datastate.filter((item, index) => {
                    return (
                      item.Sp == '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3' ||
                      item.Sp == '0x490BC3FCc845d37C1686044Cd2d6589585DE9B8B'
                    );
                  }).length < 10
                    ? false
                    : {}
                }
                columns={columns}
                dataSource={datastate.filter((item, index) => {
                  return (
                    item.Sp == '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3' ||
                    item.Sp == '0x490BC3FCc845d37C1686044Cd2d6589585DE9B8B'
                  );
                })}
                onChange={onChange}
                rowClassName={(record, index) => {
                  return record;
                }}
              />
            </TabPane>
          ) : (
            <TabPane tab="PLGR" key="PLGR">
              <Table
                pagination={
                  datastate.filter((item, index) => {
                    return item.Sp == '0x6Aa91CbfE045f9D154050226fCc830ddbA886CED';
                  }).length < 10
                    ? false
                    : {}
                }
                columns={columns}
                dataSource={datastate.filter((item, index) => {
                  return item.Sp == '0x6Aa91CbfE045f9D154050226fCc830ddbA886CED';
                })}
                onChange={onChange}
                rowClassName={(record, index) => {
                  return record;
                }}
              />
            </TabPane>
          )}
        </Tabs>
        <Tabs defaultActiveKey="1" onChange={callback} className="media_tab">
          <TabPane tab="BUSD" key="BUSD">
            <Table
              pagination={
                datastate.filter((item, index) => {
                  return (
                    item.Sp == '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' ||
                    item.Sp == '0xE676Dcd74f44023b95E0E2C6436C97991A7497DA'
                  );
                }).length < 10
                  ? false
                  : {}
              }
              columns={columns1}
              dataSource={datastate.filter((item, index) => {
                return (
                  item.Sp == '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56' ||
                  item.Sp == '0xE676Dcd74f44023b95E0E2C6436C97991A7497DA'
                );
              })}
              onChange={onChange}
              rowClassName={(record, index) => {
                return record;
              }}
            />
          </TabPane>
          <TabPane tab="USDT" key="USDT">
            <Table
              pagination={
                datastate.filter((item, index) => {
                  return item.Sp == '';
                }).length < 10
                  ? false
                  : {}
              }
              columns={columns1}
              dataSource={datastate.filter((item, index) => {
                return item.Sp == '';
              })}
              onChange={onChange}
              rowClassName={(record, index) => {
                return record;
              }}
            />
          </TabPane>
          <TabPane tab="DAI" key="DAI">
            <Table
              pagination={
                datastate.filter((item, index) => {
                  return (
                    item.Sp == '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3' ||
                    item.Sp == '0x490BC3FCc845d37C1686044Cd2d6589585DE9B8B'
                  );
                }).length < 10
                  ? false
                  : {}
              }
              columns={columns1}
              dataSource={datastate.filter((item, index) => {
                return (
                  item.Sp == '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3' ||
                  item.Sp == '0x490BC3FCc845d37C1686044Cd2d6589585DE9B8B'
                );
              })}
              onChange={onChange}
              rowClassName={(record, index) => {
                return record;
              }}
            />
          </TabPane>
        </Tabs>
      </DappLayout>
    </div>
  );
}
export default HomePage;
