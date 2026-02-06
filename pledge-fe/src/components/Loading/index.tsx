import React from 'react';
import logo from '_src/assets/images/vector.png';

import './index.less';

export interface ILoadingProps {
  style?: React.CSSProperties;
}

const Loading: React.FC<ILoadingProps> = ({ style }) => {
  return (
    <div className="component_loading" style={style}>
      <img src={logo} className="logo" />
    </div>
  );
};

Loading.defaultProps = {};

export default Loading;
