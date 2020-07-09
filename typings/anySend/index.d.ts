
declare interface IOptions {
  boolean?:boolean
  data?:any
  showNotice?:boolean
  showErrorNotice?:boolean
}
declare interface IAxiosRequestConfig extends IOptions,AxiosRequestConfig{

}
declare type Surround = (...arg:any[])=>Promise<boolean | void >
declare interface IBaseProxy {
  renderLoading: (...param:any[])=>void
  renderNotice:(...param:any[])=>void
  closeLoading:(...param:any[])=>void
  before:Surround
  after:Surround
  [name:string]:any
}
declare type IAopParam  = string | Surround
declare type ParamType<T> = T extends (param: infer P) => any ? P : T;
