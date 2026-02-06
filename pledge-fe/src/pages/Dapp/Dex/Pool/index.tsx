import React, { useMemo } from 'react';
import { Pair } from '@pswww/sdk';
import { Button, CardBody, Text } from '@pancakeswap-libs/uikit';
import { Link } from 'react-router-dom';
import FullPositionCard from '_components/PositionCard';
import { useTokenBalancesWithLoadingIndicator } from '_src/state/wallet/hooks';
import { StyledInternalLink } from '_components/Shared';
import { LightCard } from '_components/Card';
import { RowBetween } from '_components/Row';
import { AutoColumn } from '_components/Column';

import { useActiveWeb3React } from '_src/hooks';
import { usePairs } from '_src/data/Reserves';
import { toV2LiquidityToken, useTrackedTokenPairs } from '_src/state/user/hooks';
import { Dots } from '_components/swap/styleds';
import useI18n from '_src/hooks/useI18n';
import AppBody from '../AppBody';
import ConnectWalletButton from '_src/components/ConnectWalletButton';
import hezi from '_src/images/Group2102.png';
import styled from 'styled-components';
import PageUrl from '_constants/pageURL';
import CardNav from '_components/CardNav';

import './index.less';

export default function Pool() {
  const { account } = useActiveWeb3React();
  const TranslateString = useI18n();

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs();
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs],
  );
  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken), [
    tokenPairsWithLiquidityTokens,
  ]);
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens,
  );

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0'),
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances],
  );

  const v2Pairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens));
  const v2IsLoading =
    fetchingV2PairBalances ||
    v2Pairs?.length < liquidityTokensWithBalances.length ||
    v2Pairs?.some((V2Pair) => !V2Pair);

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair));

  return (
    <>
      <CardNav activeIndex={1} />
      <RowBetween padding="0 8px" style={{ width: '640px', marginBottom: '40px' }}>
        <Text color="#262533" style={{ fontWeight: 500, fontSize: '20px', lineHeight: '34px' }}>
          {TranslateString(107, 'Your Liquidity')}
        </Text>
        <Button
          id="join-pool-button"
          as={Link}
          to={PageUrl.Add_Single.replace(':currencyIdA', 'BNB')}
          style={{
            width: '122px',
            height: '34px',
            background: '#5D52FF',
            borderRadius: '10px',
            padding: '5px 10px',
            fontWeight: 500,
            fontSize: '15px',
            lineHeight: '24px',
          }}
        >
          {TranslateString(168, 'Add Liquidity')}
        </Button>
      </RowBetween>
      <AppBody>
        <AutoColumn
          gap="lg"
          justify="center"
          style={{
            width: '640px',
            height: '328px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #E6E6EB',
            borderRadius: '20px',
          }}
        >
          <CardBody>
            <AutoColumn gap="12px">
              {!account ? (
                <LightCard padding="40px" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Text color="textDisabled" textAlign="center" style={{ marginBottom: '20px' }}>
                    {TranslateString(156, 'Connect to a wallet to view your liquidity.')}
                  </Text>
                  <ConnectWalletButton
                    width="161px"
                    height="38px"
                    style={{
                      fontWeight: 500,
                      fontSize: '16px',
                      color: '#FFF',
                      background: '#5D52FF',
                      padding: '7px 18px',
                    }}
                  />
                </LightCard>
              ) : v2IsLoading ? (
                <LightCard padding="40px">
                  <Text color="textDisabled" textAlign="center">
                    <Dots>Loading</Dots>
                  </Text>
                </LightCard>
              ) : allV2PairsWithLiquidity?.length > 0 ? (
                <>
                  {allV2PairsWithLiquidity.map((v2Pair) => (
                    <FullPositionCard key={v2Pair.liquidityToken.address} pair={v2Pair} />
                  ))}
                </>
              ) : (
                <LightCard padding="40px" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <img src={hezi} alt="" style={{ width: '65px', height: '50px', marginBottom: '10px' }} />
                  <Text color="textDisabled" textAlign="center">
                    {TranslateString(104, 'No liquidity found.')}
                  </Text>
                </LightCard>
              )}
            </AutoColumn>
          </CardBody>
        </AutoColumn>
      </AppBody>
      <div>
        <Text fontSize="14px" style={{ padding: '.5rem 0 .5rem 0', color: '#111729' }}>
          {TranslateString(106, "Don't see a pool you joined?")}{' '}
          <StyledInternalLink id="import-pool-link" to="/find" style={{ color: '#5D52FF' }}>
            {TranslateString(108, 'Import it.')}
          </StyledInternalLink>
        </Text>
      </div>
    </>
  );
}
