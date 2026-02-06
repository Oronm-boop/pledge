// 定义URL
const URLSource = {
  info: {
    poolBaseInfo: '/poolBaseInfo',
    poolDataInfo: '/poolDataInfo',
  },
};

// 联调环境接口判断
const baseUrl = {
  // development: 'https://dev-v2-backend.pledger.finance',
  development: 'https://pledge.rcc-tec.xyz',
  production: 'https://pro.test.com/api',
  v22: 'https://v2-backend.pledger.finance/api/v22',
  // v21: 'https://dev-v2-backend.pledger.finance/api/v21',
  v21: 'https://pledge.rcc-tec.xyz/api/v22',
};

// 代理监听 URL配置
const handler = {
  get(target, key) {
    // get 的trap 拦截get方法
    let value = target[key];
    const nowHost = window.location.hostname;

    try {
      return new Proxy(value, handler); // 使用try catch 巧妙的实现了 深层 属性代理
    } catch (err) {
      if (typeof value === 'string') {
        let base = baseUrl.v21;
        if (nowHost.includes('127.0.0.1') || nowHost.includes('localhost')) {
          base = baseUrl['v21'];
        }
        if (nowHost.includes('dev-v2-pledger')) {
          base = baseUrl['v21'];
        }
        if (nowHost.includes('v2-pldeger')) {
          base = baseUrl['v22'];
        }
        return base + value;
      }
    }
  },
  set(target, key) {
    // 阻止外部误操作，导致URL配置文件被修改，设置属性为只读属性
    try {
      return new Proxy(target[key], handler);
    } catch (err) {
      return true;
    }
  },
};

const URL = new Proxy(URLSource, handler);

export default URL;
