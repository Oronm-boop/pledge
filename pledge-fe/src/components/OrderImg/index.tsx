import React from 'react';
import classnames from 'classnames';

import BUSD from '_src/assets/images/order_BUSD.png';
import BTCB from '_src/assets/images/order_BTCB.png';
import USDT from '_src/assets/images/order_USDT.png';
import DAI from '_src/assets/images/order_DAI.png';
import BNB from '_src/assets/images/order_BNB.png';

import './index.less';

export interface IOrderImg {
  img1: string;
  img2: string;
  className?: string;
  style?: React.CSSProperties;
}

const OrderImg: React.FC<IOrderImg> = ({ className, style, img1, img2 }) => {
  return (
    <div className={classnames('components_order_img')} style={style}>
      <img src={img1} alt="" className="img1" />
      <img src={img2} alt="" className="img2" />
    </div>
  );
};

OrderImg.defaultProps = {
  className: '',
  style: null,
  img1: '',
  img2: '',
};

export default OrderImg;
