declare interface Instance<Req, Res> {
  (options: Partial<Req>): Promise<Partial<Res>>
}

declare interface IOptions {
  data?: any;
  url?: string;
  interceptorRequest?: (
    interceptorRequests: Array<TransformFunction<any>>
  ) => Array<TransformFunction<any>>;
  interceptorResponse?: (
    interceptorResponses: Array<TransformFunction<any>>
  ) => Array<TransformFunction<any>>;
  showNotice?: boolean;
  showErrorNotice?: boolean;
}

declare interface IAxiosReq extends IOptions, AxiosRequestConfig {
}

declare type Surround = (...arg: any[]) => Promise<boolean | void>

declare interface IBaseProxy {
  renderLoading: (...param: any[]) => void
  renderNotice: (...param: any[]) => void
  closeLoading: (...param: any[]) => void
  before: Surround
  after: Surround

  [name: string]: any
}

declare type IAopParam = string | Surround
declare type ParamType<T> = T extends (param: infer P) => any ? P : T;

declare interface IAnySend {

}

declare type TransformFunction<T> = (options: Partial<T>) => Partial<T>

declare interface IInterceptorInstance {
  intercept: (...arg: any[]) => any;
}

declare interface IExceptionFilter {
  catch: (context: any, e: any) => void;
}

declare interface ICodeExceptionFilter {
  catch: (context: any, e: any, ...params: any[]) => void;

  discernCode(e: any, ...params: any[]): boolean;
}

declare interface IPipeTransform {
  transform(value: any): any;
}

declare interface IPipeTransform {
  transform(value: any): any;
}

declare interface IValidationPipe extends IPipeTransform {
  validate(value: any): Promise<any> | never
}

declare interface IAxiosOptions extends IOptions, AxiosRequestConfig {

}
