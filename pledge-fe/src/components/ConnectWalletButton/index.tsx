import React from 'react';
import { Button, ButtonProps, useWalletModal } from '@pancakeswap-libs/uikit';
import useI18n from '_src/hooks/useI18n';
import { useSetRecoilState } from 'recoil';
import { walletModalOpen } from './../../model/global';

const UnlockButton: React.FC<ButtonProps> = (props) => {
  const TranslateString = useI18n();
  const setWalletModalOpen = useSetRecoilState(walletModalOpen);
  return (
    <Button
      onClick={() => {
        setWalletModalOpen(true);
      }}
      style={{ color: '#fff', border: 'none', background: ' rgb(93, 82, 255)' }}
      {...props}
    >
      {TranslateString(292, 'Connect Wallet')}
    </Button>
  );
};

export default UnlockButton;
