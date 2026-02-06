import axios from './dataProxy';
import URL from '_constants/URL';

/**
 * 用户中心
 */
const userServer = {
  /**
   * 登录接口
   * @param {object} data - 请求参数
   */
  async getpoolBaseInfo(chainId) {
    return await axios.get(`${URL.info.poolBaseInfo}?chainId=${chainId}`);
  },
  async getpoolDataInfo(chainId) {
    return await axios.get(`${URL.info.poolDataInfo}?chainId=${chainId}`);
  },
};

export default userServer;
