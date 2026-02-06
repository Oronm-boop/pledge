import React from 'react';
import styled from 'styled-components';
export const Text = styled.div<{
  bold?: boolean;
  fontSize?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginTop?: number;
  color?: string;
}>`
  color: ${({ color }) => (color ? color : '#000')};
  font-size: ${({ fontSize }) => (fontSize ? fontSize + 'px' : '14px')};
  font-weight: ${({ bold }) => (bold ? 600 : 400)};
  line-height: 1.5;
  margin-bottom: ${(props) => props.marginBottom + 'px'};
  margin-left: ${(props) => props.marginLeft + 'px'};
  margin-top: ${(props) => props.marginTop + 'px'};
`;

export const Flex = styled.div<{
  gap?: number | boolean;
  between?: boolean;
  marginBottom?: number;
}>`
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.between ? 'space-between' : undefined)};
  margin-bottom: ${(props) => props.marginBottom + 'px'};

  > * {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    margin-right: ${(props) => (typeof props.gap === 'number' ? props.gap + 'px' : props.gap ? 'px' : undefined)};
  }
`;
export const Box = styled.div<{
  marginBottom?: number;
}>`
  margin-bottom: ${(props) => props.marginBottom + 'px'};
`;
