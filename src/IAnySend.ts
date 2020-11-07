/**
 * 抽象类，想要达到任何异步操作（axios、jq的ajax 还有rpc之类的）都可以用该接口实现
 * 你要做的就是实现好这些抽象方法
 */

export abstract class IAnySend<Req extends IOptions, Res> {
  private transformReq: Array<TransformFunction<Req>> = []
  private transformRes: Array<TransformFunction<Res>> = []
  protected constructor() {
    this.init()
  }
  public async send<T>(options: Req): Promise<T> {
    let result: any
    let interceptorRequests: Array<TransformFunction<Req>> = this.transformReq.slice(0)

    if (typeof options.interceptorRequest === 'function') {
      interceptorRequests = options.interceptorRequest(interceptorRequests)
    }
    // 生成新的配置项
    const newOptions: Partial<Req> = interceptorRequests.reduce((res: Partial<Req>, fn) => {
      return fn.call(this, res)
    }, options)

    try {
      result = (await this.instance(newOptions)) as Res
    } catch (e) {
      // tslint:disable-next-line:no-console
      console.error('发送失败:', e)
      throw e
    }
    let interceptorResponses: Array<TransformFunction<any>> = this.transformRes.slice(0)

    if (typeof options.interceptorResponse === 'function') {
      interceptorResponses = options.interceptorResponse(interceptorResponses)
    }
    // 生成新的返回结果
    const newResult = interceptorResponses.reduce((res, fn) => {
      return fn.call(this, res)
    }, result)
    const isSuccess: boolean = this.isSuccess(newResult)

    if (!isSuccess) {
      throw newResult
    }

    return this.transformData(newResult) as T
  }
  protected abstract instance(options: Partial<Req>): Promise<any>
  protected abstract isSuccess(result: any): boolean
  protected abstract transformData(result: any): any
  protected abstract interceptorRequest(res: Partial<Req>): Partial<Req>
  protected abstract interceptorResponse(response: Partial<any>): Partial<any>
  private init() {
    this.transformReq.push(this.interceptorRequest)
    this.transformRes.push(this.interceptorResponse)
  }
}
