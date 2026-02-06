import React, { ReactNode } from 'react';
import classnames from 'classnames';

import './index.less';

export interface IDappLayout {
  title?: string;
  info?: JSX.Element | string | number;
  className?: string;
  style?: React.CSSProperties;
  children: ReactNode;
}

const DappLayout: React.FC<IDappLayout> = ({ title, info, children, className, ...props }) => {
  return (
    <section className={classnames('dapp-layout', className)} {...props}>
      <h2 className="landingbox_title" style={{ display: 'flex', alignItems: 'flex-start' }}>
        {title}
        <p style={{ margin: '0', color: 'blue' }}>(Experimental version, use at your own risk)</p>
      </h2>

      <div className="landingbox_info">{info}</div>
      {children}
    </section>
  );
};

DappLayout.defaultProps = {
  title: '',
  info: null,
  className: '',
  style: null,
};

export default DappLayout;
