import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { ButtonMenu, ButtonMenuItem } from '@pancakeswap-libs/uikit';
import useI18n from '_src/hooks/useI18n';
import pageURL from '_constants/pageURL';

const StyledNav = styled.div`
  margin-bottom: 40px;
`;
const PledgeNav = styled.div`
  & > div {
    height: 56px;
    background: #f5f5fa;
    border-radius: 15px;
    height: 48px;
  }
  & > div > div > a {
    width: 153.48px;
    height: 48px;
    border-radius: 11px;
    background: #f5f5fa;
    font-weight: 500;
    font-size: 20px;
    line-height: 30px;
    text-align: center;
    font-style: normal;

    color: #8b89a3;
  }
  & > div > div > a {
    background: #f5f5f5;
    border-radius: 11px;
    color: #000;
  }
  & > div > div > .duHWaa {
    background-color: #fff;
  }
  & > div > div > .sc-kstrdz {
    background: #f5f5fa;
    border-radius: 15px;
    color: #8b89a3;
  }
  & > div > div {
    background: #f5f5fa;
  }
`;
function Nav({ activeIndex = 0 }: { activeIndex?: number }) {
  const TranslateString = useI18n();
  return (
    <PledgeNav>
      <StyledNav>
        <ButtonMenu activeIndex={activeIndex} scale="sm" variant="subtle">
          <ButtonMenuItem id="swap-nav-link" to={pageURL.DEX_Swap} as={Link} style={{}}>
            {TranslateString(1142, 'Swap')}
          </ButtonMenuItem>
          <ButtonMenuItem id="pool-nav-link" to={pageURL.DEX_Pool} as={Link}>
            {TranslateString(262, 'Liquidity')}
          </ButtonMenuItem>
        </ButtonMenu>
      </StyledNav>
    </PledgeNav>
  );
}

export default Nav;
