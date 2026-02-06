import React, { ReactNode } from 'react';
import classnames from 'classnames';

import { HomeOutlined, SettingFilled, SmileOutlined, SyncOutlined, LoadingOutlined } from '@ant-design/icons';

import './index.less';

export interface IButtonProps {
  rightAngleDirection?: 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom' | 'null';
  type?: 'paramy' | 'default';
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  loading?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

const Button: React.FC<IButtonProps> = ({
  children,
  disabled,
  className,
  rightAngleDirection,
  style,
  type,
  loading,
  onClick,
  ...props
}) => {
  function handleOnClick() {
    if (!disabled) {
      onClick();
    }
  }
  return (
    <div
      className={classnames(
        'components_button',
        className,
        { [`rad_${rightAngleDirection}`]: rightAngleDirection },
        { [`type_${type}`]: type },
        { btn_disabled: disabled },
      )}
      style={style}
      onClick={handleOnClick}
      {...props}
    >
      {loading == true ? <LoadingOutlined style={{ marginRight: '7px', color: '#fff' }} id="loading" /> : ''}
      {children}
    </div>
  );
};

Button.defaultProps = {
  rightAngleDirection: 'null',
  className: '',
  type: 'paramy',
  style: null,
  disabled: false,
  onClick: () => {},
};

export default Button;
