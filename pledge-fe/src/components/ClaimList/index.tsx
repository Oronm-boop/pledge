import classNames from 'classnames';
import React from 'react';

import { Collapse, Statistic, Row, Col, Table, Steps, message } from 'antd';

import Button from '_components/Button';
import OrderImg from '_components/OrderImg';

import './index.less';

export interface IClaimList {
  className?: string;
  style?: React.CSSProperties;
}

const ClaimList: React.FC<IClaimList> = ({ className, ...props }) => {
  const { Panel } = Collapse;
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
  const DetailList = [
    {
      title: 'Detail',
      Total_financing: '388,000,000 BUSD',
      Balance: '100.00 JP-Token',
      Pledge: '10 BTCB',
      Time: '2021.12.12 12:22',
    },
    {
      title: 'Reward',
      The_principal: '100.00 BUSD',
      Expected_interest: '10.0000 BUSD',
    },
  ];

  return (
    <div className={classNames('claim_list', className)} {...props}>
      <Collapse bordered={false} expandIconPosition="right" ghost={true}>
        <Panel
          header={
            <Row gutter={16}>
              <Col span={4}>
                <OrderImg img1="BUSD" img2="BTCB" />
                <Statistic title="BUSD-BTCB" />
              </Col>
              <Col span={4}>
                <Statistic title="2,000 BUSD" />
              </Col>
              <Col span={4}>
                <Statistic title="1,000 BUSD" />
              </Col>
              <Col span={4}>
                <Statistic title="1,000 BUSD" />
              </Col>
              <Col span={4}>
                <Statistic title="200 BUSD" />
              </Col>
              <Col span={4}>
                <Button style={{ height: '40px', fontSize: '16px', lineHeight: '40px' }}>Claim</Button>
              </Col>
            </Row>
          }
          key="1"
        >
          <div className="order_box">
            {DetailList.map((item, index) => {
              console.log(item);
              return item.title == 'Detail' ? (
                <ul className="order_list" key={index}>
                  <p>{item.title}</p>
                  <li>
                    <span>Total_financing</span> <span>{item.Total_financing}</span>
                  </li>
                  <li>
                    <span>Balance</span> <span>{item.Balance}</span>
                  </li>
                  <li>
                    <span>Pledge</span> <span>{item.Pledge}</span>
                  </li>
                  <li>
                    <span>Time</span> <span>{item.Time}</span>
                  </li>
                </ul>
              ) : (
                <ul className="order_list" key={index}>
                  <p>{item.title}</p>
                  <li>
                    <span>The_principal</span>
                    <span>{item.The_principal}</span>
                  </li>
                  <li>
                    <span>Expected_interest</span>
                    <span>{item.Expected_interest}</span>
                  </li>
                </ul>
              );
            })}
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

ClaimList.defaultProps = {
  className: '',
  style: null,
};
export default ClaimList;
