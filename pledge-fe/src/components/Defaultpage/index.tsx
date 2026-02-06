import React from 'react';
import classnames from 'classnames';
import { DappLayout } from '_src/Layout';
import PortfolioList from '_components/PortfolioList';
import { Tooltip, Button, Empty } from 'antd';
import Emptyimg from '_assets/images/empty.png';

import './index.less';

export interface IDefaultpage {
  className?: string;
  style?: React.CSSProperties;
  mode: any;
}

const Defaultpage: React.FC<IDefaultpage> = ({ className, style, mode }) => {
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
    <div style={style}>
      <DappLayout title={`${mode} Order`} className="dapp_mode_page">
        <div className="order_empty">
          <p className="prtfolioList_title">
            {PortfolioListTitle.map((item, index) => {
              return (
                <span className="all_tab" key={index}>
                  {item}
                </span>
              );
            })}
            {PortfolioListTitle1.map((item, index) => {
              return <span className="media_tab" key={index}></span>;
            })}
          </p>
          <Empty
            image={Emptyimg}
            imageStyle={{
              height: 60,
            }}
            description={<span>No {mode} order</span>}
          >
            <Button type="primary" className="emptybutton">
              <a href="/">Go to maket pool</a>
            </Button>
          </Empty>
        </div>
      </DappLayout>
    </div>
  );
};

Defaultpage.defaultProps = {
  className: '',
  style: null,
};

export default Defaultpage;
