import React from 'react'
import { Modal } from '@pancakeswap-libs/uikit'
import styled from 'styled-components'
import SlippageToleranceSetting from './SlippageToleranceSetting'
import TransactionDeadlineSetting from './TransactionDeadlineSetting'


const Settingtab = styled.div`
z-index:10;
border-radius: 16px;
background: #F5F5FA;
div:nth-child(1)>h2{
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #262533;
}

div:nth-child(1){
  font-weight: 400;
font-size: 14px;
line-height: 20px;
color: #4F4E66;
background: #F5F5FA;
border:none;
border-radius: 16px;

button:nth-child(2){
  display:none
}
&>div>button{
  background: #FFFFFF;
border: 1px solid #BCC0CC;
box-sizing: border-box;
border-radius: 14px;
width:49px;
height:28px;
color: #111729;
}
&>div>button:focus{
  color: #FFFFFF;
  background: #5D52FF;
}
&>input{
  background: #FFFFFF;
  border: 1px solid #EAEDF5;
  box-sizing: border-box;
  border-radius: 14px;
  width:90px;
  height:28px
}
}
div:nth-child(2)>div:nth-child(2)>div>input{
  background: #FFFFFF;
border: 1px solid #EAEDF5;
box-sizing: border-box;
border-radius: 14px;
width:90px;
height:28px
}
&>div:nth-child(1)>div{
  padding:16px 16px 0
  
  }
&>div>div{
padding:16px
}
}
`
// TODO: Fix UI Kit typings

const SettingsModal = ({ translateString }) => {
  return (
    <Settingtab className='Settingtab'>
    <Modal title='Transaction Settings' >
      <SlippageToleranceSetting translateString={translateString} />
      <TransactionDeadlineSetting translateString={translateString} />
    </Modal>
    </Settingtab>
  )
}

export default SettingsModal
