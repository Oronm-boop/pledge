import React from 'react';
import classnames from 'classnames';
import LeftMenu from '_containers/LeftMenu';
import SwitchLanguage from '_components/SwitchLanguage';
import SwitchThemes from '_components/SwitchThemes';
import Footer from '_components/Footer';
import Header from '_components/Header';

import './index.less';

interface IwebLayout {
  className?: string;
}

const WebLayout: React.FC<IwebLayout> = ({ children, className, ...props }) => {
  return (
    <div className={classnames('web-layout', className)}>
      {children}
      <Footer />
    </div>
  );
};

export default WebLayout;
