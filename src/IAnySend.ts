export abstract class IAnySend<I extends (options: any) => {}> {
  constructor(config: any, plugin: any) {
    this.instance = this.init(config, plugin)
  }
  protected instance: I
  protected abstract isSuccess(result: any): boolean
  protected abstract transformData(result: any): any
  protected abstract interceptorRequest(res: any): any
  protected abstract interceptorResponse(response: any): any
  protected abstract interceptorError(error: any): any
  protected abstract init(config: any, plugin: any): I
  public async send<T>(options: IOptions): Promise<T | boolean> {
    let result
    try {
      result = await this.instance(options)
    } catch (e) {
      result = e
      console.error('发送失败:', e)
    }
    const isSuccess: boolean = this.isSuccess(result)
    const data = this.transformData(result)
    if (!isSuccess) throw result
    if (options.boolean) return isSuccess
    return data as T
  }
}
