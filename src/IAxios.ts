import { IAnySend } from './IAnySend'

export const POST_METHODS = ['post', 'put', 'delete', 'patch']

/**
 * 这里只实现发射器instance，其他的抽象函数可以自由的交给后续子类实现
 * 如果觉得实现的不合理，可以直接使用IAnySend
 * 不要直接调用instance来获取数据，而是通过send方法因为后续会对send方法做代理和增强
 */
export abstract class IAxios extends IAnySend<IAxiosOptions, AxiosResponse<any>> {
  public axios: AxiosInstance

  constructor(config: IAxiosOptions, axios: AxiosStatic) {
    super()
    this.axios = axios.create({
      ...config
    })
    this.defaultHeaderHelper()
  }

  protected instance(options: Partial<IAxiosOptions> = {}): Promise<AxiosResponse<any>> {
    return this.axios(options)
  }

  protected defaultHeaderHelper() {
    POST_METHODS.forEach(method => {
      if (this.axios) {
        this.axios.defaults.headers[method]['Content-Type'] = 'application/json;charset=UTF-8'
        this.axios.defaults.headers[method]['X-Requested-With'] = 'XMLHttpRequest'
      }
    })
  }
}
