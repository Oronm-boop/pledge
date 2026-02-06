import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { Heading, IconButton, Text, Flex, useModal } from '@pancakeswap-libs/uikit';
import useI18n from '_src/hooks/useI18n';
import SettingsModal from './SettingsModal';
import shezhi from '../../images/Icon(5).png';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

const StyledPageHeader = styled.div`
  padding: 20px 20px 0 20px;
`;
const Details = styled.div`
  flex: 1;
`;

const PageHeader = ({ title, description, children }: PageHeaderProps) => {
  const TranslateString = useI18n();
  const [onPresentSettings] = useModal(<SettingsModal translateString={TranslateString} />);

  return (
    <StyledPageHeader>
      <Flex alignItems="center">
        <Details>
          <Heading mb="8px" style={{ color: '#262533', fontWeight: 500, fontSize: '16px', lineHeight: '24px' }}>
            {title}
          </Heading>
          {description && (
            <Text color="textSubtle" fontSize="14px">
              {description}
            </Text>
          )}
        </Details>
        <IconButton variant="text" onClick={onPresentSettings} title={TranslateString(1200, 'Settings')}>
          <img src={shezhi} alt="" />
        </IconButton>
      </Flex>
      {children && <Text mt="16px">{children}</Text>}
    </StyledPageHeader>
  );
};

export default PageHeader;
