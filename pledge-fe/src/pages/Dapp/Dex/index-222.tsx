import React, { useState, useEffect } from 'react';
import { useRouteMatch, useHistory } from 'react-router-dom';

import { Tabs, InputNumber, Popover, Space, Tooltip, Select, Cascader, Modal } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { DappLayout } from '_src/Layout';
import pageURL from '_constants/pageURL';
import Coin_pool from '_components/Coin_pool';
import Button from '_components/Button';
import styled, { css } from 'styled-components';
import './index.less';
import { color } from 'echarts';
import PageHeader from '_components/PageHeader';
const { Option } = Select;
type Iparams = {
  mode: 'Swap' | 'Liquidity';
};
const InputCurrency = styled.div`
  display: flex;
  width: 154px;
  justify-content: space-between;
`;
const CurrencySelect = styled(Select)`
  background: #f5f5fa;
  border-radius: 10px;
  overflow: hidden;
`;
const CurrencyRow = styled.div`
  display: flex;
  align-items: center;
  padding-bottom: 10px;
  justify-content: space-between;
`;
const Blance = styled.div`
  text-align: right;
  color: #8b89a3;
  line-height: 22px;
  font-size: 14px;
`;
const ContentTitle = styled.div`
  line-height: 20px;
  font-weight: 600;
  color: #262533;
`;
const ContentTab = styled.div`
  color: #4f4e66;
`;
const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const SlippageWrap = styled.div`
  background: #ffffff;
  padding: 0 10px;
  border: 1px solid #bcc0cc;
  border-radius: 14px;
  display: flex;
  align-items: center;
  & :hover {
    color: #fff;
    background: #5d52ff;
  }
  input {
    text-align: right;
    height: 24px;
    padding: 0;
    & :hover {
      color: #fff;
    }
  }
`;
function Dex() {
  const history = useHistory();
  const { url: routeUrl, params } = useRouteMatch<Iparams>();
  const { mode } = params;
  const [activeKey, setActiveKey] = useState<string>(mode);
  const { TabPane } = Tabs;
  const [slippagevalue, setslippagevalue] = useState(0.5);
  const [slippagetime, setslippagetime] = useState(20);
  const onChanges = (newActiveKey: string) => {
    setActiveKey(newActiveKey);
    // history.replace(pageURL.DEX.replace(':mode', `${newActiveKey}`));
  };
  function handleOnChange(value) {
    setslippagevalue(value);
  }
  function handleOnChange2(value) {
    setslippagetime(value);
  }
  const onChange = (key: string) => {
    console.log(key);
  };

  return (
    <DappLayout title={`${activeKey} Dex`} className="dapp_Dex">
      测试
      {/* <Tabs defaultActiveKey="Swap" activeKey={activeKey} onChange={onChanges}>
        <TabPane tab="Swap" key="Swap">
          e eeeeeee
        </TabPane>
        <TabPane tab="Liquidity" key="Liquidity">
          12313
        </TabPane>
      </Tabs>
      <Tabs defaultActiveKey="1" onChange={onChange}>
        <TabPane tab="Tab 1" key="1">
          Content of Tab Pane 1
        </TabPane>
        <TabPane tab="Tab 2" key="2">
          Content of Tab Pane 2
        </TabPane>
        <TabPane tab="Tab 3" key="3">
          Content of Tab Pane 3
        </TabPane>
      </Tabs> */}
    </DappLayout>
  );
}

export default Dex;
