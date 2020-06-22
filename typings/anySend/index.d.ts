
declare interface IOptions {
  boolean?:boolean
  data?:any
  showNotice?:boolean
  showErrorNotice?:boolean
}
declare interface IAxiosRequestConfig extends IOptions,AxiosRequestConfig{

}
declare type Surround = (...arg:any[])=>Promise<boolean | void >
declare interface IProxySend {
  renderLoading:()=>void
  renderNotice:()=>void
  closeLoading:()=>void
  before:Surround
  after:Surround
  [key:string]:()=>void
}
declare type IAopParam  = string | Surround
declare type ParamType<T> = T extends (param: infer P) => any ? P : T;
