import { IAnySend } from './IAnySend'
import Qs from 'qs'
export const POST_METHODS = ['post', 'put', 'delete', 'patch']
export class IAxiosSend extends IAnySend<AxiosInstance> {
  private readonly defaultConfig: AxiosRequestConfig = {
    // 请求的接口，在请求的时候，如axios.get(url,config);这里的url会覆盖掉config中的url
    url: '',
    withCredentials: true,
    crossDomain: true,
    // 请求方法同上
    method: 'post', // default
    // 基础url前缀
    baseURL: '',
    transformRequest: [],
    transformResponse: [
      function(data: string) {
        // 这里提前处理返回的数据
        try {
          return JSON.parse(data)
        } catch (e) {
          return data
        }
      }
    ],

    // 请求头信息
    headers: {},

    // parameter参数
    params: {},

    // post参数，使用axios.post(url,{},config);如果没有额外的也必须要用一个空对象，否则会报错
    data: {},
    // 设置超时时间
    timeout: 50000,
    // 返回数据类型
    responseType: 'json' // default
  }
  protected isSuccess(result: AxiosResponse): boolean {
    throw new Error('请实现判断方法')
  }

  protected transformData(result: AxiosResponse): any {
    throw new Error('请实现数据转换方法')
  }

  protected interceptorRequest(res: any): any {
    throw new Error('请实现数据转换方法')
  }

  protected interceptorResponse(response: any): any {
    throw new Error('请实现数据转换方法')
  }

  protected interceptorError(error: any): any {
    throw new Error('请实现数据转换方法')
  }
  protected init(config: AxiosRequestConfig, plugin: AxiosStatic): AxiosInstance {
    try {
      config = this.transformRequestHelper(config)
      this.instance = plugin.create({
        ...this.defaultConfig,
        ...config
      })
      this.defaultHeaderHelper()
      this.instance.interceptors.request.use(
        (config: AxiosRequestConfig): AxiosRequestConfig => {
          const result = this.interceptorRequest(config)
          return result ? result : config
        },
        error => {
          this.interceptorError(error)
        }
      )
      this.instance.interceptors.response.use(
        (response: AxiosResponse): any => {
          return this.interceptorResponse(response)
        },
        error => {
          this.interceptorError(error)
        }
      )
    } catch (e) {
      console.error('axios初始化失败:', e)
    }
    return this.instance
  }
  protected transformRequestHelper(config: IAxiosRequestConfig): IAxiosRequestConfig {
    if (!config) config = {}
    const { transformRequest } = config
    if (Array.isArray(transformRequest)) {
      transformRequest.push((data, config) => {
        // 这里可以在发送请求之前对请求数据做处理，比如form-data格式化等，这里可以使用开头引入的Qs（这个模块在安装axios的时候就已经安装了，不需要另外安装）
        if (
          config['Content-Type'] &&
          config['Content-Type'].indexOf('application/x-www-form-urlencoded') > -1
        ) {
          data = Qs.stringify(data)
        } else {
          data = JSON.stringify(data)
        }

        return data
      })
    }
    return config
  }
  protected defaultHeaderHelper() {
    POST_METHODS.forEach(method => {
      this.instance.defaults.headers[method]['Content-Type'] = 'application/json;charset=UTF-8'
      this.instance.defaults.headers[method]['X-Requested-With'] = 'XMLHttpRequest'
    })
  }
}
