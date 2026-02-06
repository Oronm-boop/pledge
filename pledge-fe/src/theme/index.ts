import type { BreakpointChecks } from '../hooks/useMatchBreakpoints';
import type { Breakpoints, DevicesQueries, MediaQueries } from './types';
import { PancakeTheme } from '@pancakeswap-libs/uikit/dist/theme';
export interface PledgeTheme extends PancakeTheme {
  breakpoints: Breakpoints;
  mediaQueries: MediaQueries;
  devicesQueries?: DevicesQueries;
  breakpointChecks: BreakpointChecks;
}

export * from './types';
