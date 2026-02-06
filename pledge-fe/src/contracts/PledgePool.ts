import BN from 'bn.js';
import BigNumber from 'bignumber.js';
import {
  PromiEvent,
  TransactionReceipt,
  EventResponse,
  EventData,
  Web3ContractContext,
} from 'ethereum-abi-types-generator';

export interface CallOptions {
  from?: string;
  gasPrice?: string;
  gas?: number;
}

export interface SendOptions {
  from: string;
  value?: number | string | BN | BigNumber;
  gasPrice?: string;
  gas?: number;
}

export interface EstimateGasOptions {
  from?: string;
  value?: number | string | BN | BigNumber;
  gas?: number;
}

export interface MethodPayableReturnContext {
  send(options: SendOptions): PromiEvent<TransactionReceipt>;
  send(options: SendOptions, callback: (error: Error, result: any) => void): PromiEvent<TransactionReceipt>;
  estimateGas(options: EstimateGasOptions): Promise<number>;
  estimateGas(options: EstimateGasOptions, callback: (error: Error, result: any) => void): Promise<number>;
  encodeABI(): string;
}

export interface MethodConstantReturnContext<TCallReturn> {
  call(): Promise<TCallReturn>;
  call(options: CallOptions): Promise<TCallReturn>;
  call(options: CallOptions, callback: (error: Error, result: TCallReturn) => void): Promise<TCallReturn>;
  encodeABI(): string;
}

export interface MethodReturnContext extends MethodPayableReturnContext {}

export type ContractContext = Web3ContractContext<
  PledgePool,
  PledgePoolMethodNames,
  PledgePoolEventsContext,
  PledgePoolEvents
>;
export type PledgePoolEvents =
  | 'ClaimBorrow'
  | 'ClaimLend'
  | 'DepositBorrow'
  | 'DepositLend'
  | 'EmergencyBorrowWithdrawal'
  | 'EmergencyLendWithdrawal'
  | 'Redeem'
  | 'RefundBorrow'
  | 'RefundLend'
  | 'SetFee'
  | 'SetFeeAddress'
  | 'SetMinAmount'
  | 'SetSwapRouterAddress'
  | 'StateChange'
  | 'Swap'
  | 'WithdrawBorrow'
  | 'WithdrawLend';
export interface PledgePoolEventsContext {
  ClaimBorrow(
    parameters: {
      filter?: { from?: string | string[]; token?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  ClaimLend(
    parameters: {
      filter?: { from?: string | string[]; token?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  DepositBorrow(
    parameters: {
      filter?: { from?: string | string[]; token?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  DepositLend(
    parameters: {
      filter?: { from?: string | string[]; token?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  EmergencyBorrowWithdrawal(
    parameters: {
      filter?: { from?: string | string[]; token?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  EmergencyLendWithdrawal(
    parameters: {
      filter?: { from?: string | string[]; token?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  Redeem(
    parameters: {
      filter?: { recieptor?: string | string[]; token?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  RefundBorrow(
    parameters: {
      filter?: { from?: string | string[]; token?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  RefundLend(
    parameters: {
      filter?: { from?: string | string[]; token?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  SetFee(
    parameters: {
      filter?: { newLendFee?: string | string[]; newBorrowFee?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  SetFeeAddress(
    parameters: {
      filter?: { oldFeeAddress?: string | string[]; newFeeAddress?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  SetMinAmount(
    parameters: {
      filter?: { oldMinAmount?: string | string[]; newMinAmount?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  SetSwapRouterAddress(
    parameters: {
      filter?: { oldSwapAddress?: string | string[]; newSwapAddress?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  StateChange(
    parameters: {
      filter?: { pid?: string | string[]; beforeState?: string | string[]; afterState?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  Swap(
    parameters: {
      filter?: { fromCoin?: string | string[]; toCoin?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  WithdrawBorrow(
    parameters: {
      filter?: { from?: string | string[]; token?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
  WithdrawLend(
    parameters: {
      filter?: { from?: string | string[]; token?: string | string[] };
      fromBlock?: number;
      toBlock?: 'latest' | number;
      topics?: string[];
    },
    callback?: (error: Error, event: EventData) => void,
  ): EventResponse;
}
export type PledgePoolMethodNames =
  | 'new'
  | 'borrowFee'
  | 'checkoutFinish'
  | 'checkoutLiquidate'
  | 'checkoutSettle'
  | 'claimBorrow'
  | 'claimLend'
  | 'createPoolInfo'
  | 'depositBorrow'
  | 'depositLend'
  | 'emergencyBorrowWithdrawal'
  | 'emergencyLendWithdrawal'
  | 'feeAddress'
  | 'finish'
  | 'getMultiSignatureAddress'
  | 'getPoolState'
  | 'getUnderlyingPriceView'
  | 'globalPaused'
  | 'lendFee'
  | 'liquidate'
  | 'minAmount'
  | 'oracle'
  | 'poolBaseInfo'
  | 'poolDataInfo'
  | 'poolLength'
  | 'refundBorrow'
  | 'refundLend'
  | 'setFee'
  | 'setFeeAddress'
  | 'setMinAmount'
  | 'setPause'
  | 'setSwapRouterAddress'
  | 'settle'
  | 'swapRouter'
  | 'userBorrowInfo'
  | 'userLendInfo'
  | 'withdrawBorrow'
  | 'withdrawLend';
export interface ClaimBorrowEventEmittedResponse {
  from: string;
  token: string;
  amount: string;
}
export interface ClaimLendEventEmittedResponse {
  from: string;
  token: string;
  amount: string;
}
export interface DepositBorrowEventEmittedResponse {
  from: string;
  token: string;
  amount: string;
  mintAmount: string;
}
export interface DepositLendEventEmittedResponse {
  from: string;
  token: string;
  amount: string;
  mintAmount: string;
}
export interface EmergencyBorrowWithdrawalEventEmittedResponse {
  from: string;
  token: string;
  amount: string;
}
export interface EmergencyLendWithdrawalEventEmittedResponse {
  from: string;
  token: string;
  amount: string;
}
export interface RedeemEventEmittedResponse {
  recieptor: string;
  token: string;
  amount: string;
}
export interface RefundBorrowEventEmittedResponse {
  from: string;
  token: string;
  refund: string;
}
export interface RefundLendEventEmittedResponse {
  from: string;
  token: string;
  refund: string;
}
export interface SetFeeEventEmittedResponse {
  newLendFee: string;
  newBorrowFee: string;
}
export interface SetFeeAddressEventEmittedResponse {
  oldFeeAddress: string;
  newFeeAddress: string;
}
export interface SetMinAmountEventEmittedResponse {
  oldMinAmount: string;
  newMinAmount: string;
}
export interface SetSwapRouterAddressEventEmittedResponse {
  oldSwapAddress: string;
  newSwapAddress: string;
}
export interface StateChangeEventEmittedResponse {
  pid: string;
  beforeState: string;
  afterState: string;
}
export interface SwapEventEmittedResponse {
  fromCoin: string;
  toCoin: string;
  fromValue: string;
  toValue: string;
}
export interface WithdrawBorrowEventEmittedResponse {
  from: string;
  token: string;
  amount: string;
  burnAmount: string;
}
export interface WithdrawLendEventEmittedResponse {
  from: string;
  token: string;
  amount: string;
  burnAmount: string;
}
export interface PoolBaseInfoResponse {
  settleTime: string;
  endTime: string;
  interestRate: string;
  maxSupply: string;
  lendSupply: string;
  borrowSupply: string;
  martgageRate: string;
  lendToken: string;
  borrowToken: string;
  state: string;
  spCoin: string;
  jpCoin: string;
  autoLiquidateThreshold: string;
}
export interface PoolDataInfoResponse {
  settleAmountLend: string;
  settleAmountBorrow: string;
  finishAmountLend: string;
  finishAmountBorrow: string;
  liquidationAmounLend: string;
  liquidationAmounBorrow: string;
}
export interface UserBorrowInfoResponse {
  stakeAmount: string;
  refundAmount: string;
  hasNoRefund: boolean;
  hasNoClaim: boolean;
}
export interface UserLendInfoResponse {
  stakeAmount: string;
  refundAmount: string;
  hasNoRefund: boolean;
  hasNoClaim: boolean;
}
export interface PledgePool {
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: constructor
   * @param _oracle Type: address, Indexed: false
   * @param _swapRouter Type: address, Indexed: false
   * @param _feeAddress Type: address, Indexed: false
   * @param _multiSignature Type: address, Indexed: false
   */
  'new'(_oracle: string, _swapRouter: string, _feeAddress: string, _multiSignature: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  borrowFee(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  checkoutFinish(_pid: string): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  checkoutLiquidate(_pid: string): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  checkoutSettle(_pid: string): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  claimBorrow(_pid: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  claimLend(_pid: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _settleTime Type: uint256, Indexed: false
   * @param _endTime Type: uint256, Indexed: false
   * @param _interestRate Type: uint64, Indexed: false
   * @param _maxSupply Type: uint256, Indexed: false
   * @param _martgageRate Type: uint256, Indexed: false
   * @param _lendToken Type: address, Indexed: false
   * @param _borrowToken Type: address, Indexed: false
   * @param _spToken Type: address, Indexed: false
   * @param _jpToken Type: address, Indexed: false
   * @param _autoLiquidateThreshold Type: uint256, Indexed: false
   */
  createPoolInfo(
    _settleTime: string,
    _endTime: string,
    _interestRate: string,
    _maxSupply: string,
    _martgageRate: string,
    _lendToken: string,
    _borrowToken: string,
    _spToken: string,
    _jpToken: string,
    _autoLiquidateThreshold: string,
  ): MethodReturnContext;
  /**
   * Payable: true
   * Constant: false
   * StateMutability: payable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   * @param _stakeAmount Type: uint256, Indexed: false
   */
  depositBorrow(_pid: string, _stakeAmount: string): MethodPayableReturnContext;
  /**
   * Payable: true
   * Constant: false
   * StateMutability: payable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   * @param _stakeAmount Type: uint256, Indexed: false
   */
  depositLend(_pid: string, _stakeAmount: string): MethodPayableReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  emergencyBorrowWithdrawal(_pid: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  emergencyLendWithdrawal(_pid: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  feeAddress(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  finish(_pid: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  getMultiSignatureAddress(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  getPoolState(_pid: string): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  getUnderlyingPriceView(_pid: string): MethodConstantReturnContext<[string, string, string]>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  globalPaused(): MethodConstantReturnContext<boolean>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  lendFee(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  liquidate(_pid: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  minAmount(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  oracle(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: uint256, Indexed: false
   */
  poolBaseInfo(parameter0: string): MethodConstantReturnContext<PoolBaseInfoResponse>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: uint256, Indexed: false
   */
  poolDataInfo(parameter0: string): MethodConstantReturnContext<PoolDataInfoResponse>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  poolLength(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  refundBorrow(_pid: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  refundLend(_pid: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _lendFee Type: uint256, Indexed: false
   * @param _borrowFee Type: uint256, Indexed: false
   */
  setFee(_lendFee: string, _borrowFee: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _feeAddress Type: address, Indexed: false
   */
  setFeeAddress(_feeAddress: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _minAmount Type: uint256, Indexed: false
   */
  setMinAmount(_minAmount: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   */
  setPause(): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _swapRouter Type: address, Indexed: false
   */
  setSwapRouterAddress(_swapRouter: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   */
  settle(_pid: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   */
  swapRouter(): MethodConstantReturnContext<string>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: address, Indexed: false
   * @param parameter1 Type: uint256, Indexed: false
   */
  userBorrowInfo(parameter0: string, parameter1: string): MethodConstantReturnContext<UserBorrowInfoResponse>;
  /**
   * Payable: false
   * Constant: true
   * StateMutability: view
   * Type: function
   * @param parameter0 Type: address, Indexed: false
   * @param parameter1 Type: uint256, Indexed: false
   */
  userLendInfo(parameter0: string, parameter1: string): MethodConstantReturnContext<UserLendInfoResponse>;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   * @param _jpAmount Type: uint256, Indexed: false
   */
  withdrawBorrow(_pid: string, _jpAmount: string): MethodReturnContext;
  /**
   * Payable: false
   * Constant: false
   * StateMutability: nonpayable
   * Type: function
   * @param _pid Type: uint256, Indexed: false
   * @param _spAmount Type: uint256, Indexed: false
   */
  withdrawLend(_pid: string, _spAmount: string): MethodReturnContext;
}
