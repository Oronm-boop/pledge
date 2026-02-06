import services from '_src/services';
import BigNumber from 'bignumber.js';
import { getAddress } from '@ethersproject/address';

const specialAsset = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

// returns the checksummed address if the address is valid, otherwise returns false
function isAddress(value: any): string | false {
  try {
    return getAddress(value);
  } catch {
    return false;
  }
}

/**
 * 获取地址栏参数 Get address bar parameters
 * @param {*} url
 */
function getUrlPrmt<T>(url?: string): T {
  url = url ? url : window.location.href;
  let _pa = url.substring(url.indexOf('?') + 1),
    _arrS = _pa.split('&');
  let _rs: T;
  for (let i = 0, _len = _arrS.length; i < _len; i++) {
    let pos = _arrS[i].indexOf('=');
    if (pos == -1) {
      continue;
    }
    let name = _arrS[i].substring(0, pos),
      value = window.decodeURIComponent(_arrS[i].substring(pos + 1));
    _rs[name] = value;
  }
  return _rs;
}

function bin2Hex(str) {
  var re = /[\u4E00-\u9FA5]/;
  var ar = [];
  for (var i = 0; i < str.length; i++) {
    var a = '';
    if (re.test(str.charAt(i))) {
      // 中文
      a = encodeURI(str.charAt(i)).replace(/%g/, '');
    } else {
      a = str.charCodeAt(i).toString(16);
    }
    ar.push(a);
  }
  str = ar.join('');
  return str;
}

function getParams() {
  const url = new URL(window.location.href);
  // url.searchParams.get('hash');
  // console.log(URLSearchParams);
  return url.searchParams;
}

// 确定小数的精度
const calDecimalPrecision = (val, num) => {
  let x = new BigNumber(val);
  let y = new BigNumber(10 ** num);
  let newAmount = x.dividedBy(y).toFormat();
  return newAmount;
};

export { getUrlPrmt, getParams, bin2Hex, calDecimalPrecision, isAddress };
