import 'reflect-metadata';

function ProxySend(_proxy:IProxySend):ClassDecorator {
  return target => {
    Object.keys(_proxy).forEach((name)=>{
      const method = _proxy[name];
      if(typeof method === 'function') {
        target.prototype[name] = method;
      }
    })
  };
}
function Controller(path:string):ClassDecorator{
  return  target => {
    Reflect.defineMetadata('Controller', path, target);
  }
}
function Unit(mark:string):ClassDecorator{
  return  target => {
    Reflect.defineMetadata('Unit', mark, target);
  }
}
export const getIn = <T>(target:any,keys:string[],defaultValue?:T)=>{
  try {
    const res = keys.reduce((res,key)=>{
      res = res[key]
      return res;
    },target)
    if(res === undefined || res === null) return defaultValue;
    return res as T
  }catch ( e ) {
    return defaultValue
  }
}
const handlerAOP =  (param:any,key:string,context:any)=>{
  const handle = getIn(param,[key]);
  const contextHandle = getIn(context,[key]);
  if(typeof handle === 'function'){
    return handle.bind(context)
  } else if(typeof contextHandle === 'function'){
    return  contextHandle.bind(context)
  }
}
function Aop(before?:IAopParam,after?:IAopParam):MethodDecorator {
  return (target, propertyKey, descriptor:TypedPropertyDescriptor<any>)=>{
    const prefix:string = Reflect.getMetadata('Controller', target);
    const unit:string = Reflect.getMetadata('Unit', target);
    const { value } = descriptor;
    type TargetValue = typeof value
    type Param = ParamType<TargetValue>;
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(param:Param):Promise<Return>{
      if(!param) param = {};
      const prefixUrl = prefix.endsWith(unit) ? prefix : prefix+unit
      param.url+= prefixUrl;
      if(typeof before === 'string') {
        param.beforeMessage = before
      }
      // 装饰器优先  => 参数的 => 全局的
      if(!param.closeBefore) {
        if(typeof before === 'function') {
          await before.call(this,param)
        } else {
          await handlerAOP(param,'before',this)(param)
        }
      }
      const result:Return = await value(param);
      if(!param.closeAfter) {
        if(typeof after === 'function') {
          await after.call(this,param)
        } else {
          await handlerAOP(param,'after',this)(result,param)
        }
      }
      return result
    }
    return descriptor
  }
}
// 渲染loading
function Loading(message:string):MethodDecorator {
  return (target, propertyKey, descriptor:TypedPropertyDescriptor<any>)=>{
    const { value } = descriptor;
    type TargetValue = typeof value
    type Param = ParamType<TargetValue>;
    type Return = ReturnType<TargetValue>
    descriptor.value = async function (this:any,param:Param):Promise<Return> {
      if(!param) param = {};
      param.loadingMessage = message;
      if(this.renderLoading) {
        await this.renderLoading(param);
      }
      try {
        return  value.call(this,param)

      } catch (e) {
        throw e
      } finally {
        if(this.closeLoading) {
          this.closeLoading(param)
        }
      }
    }
    return descriptor;
  }
}

function showNotice(successMessage?:string,ErrorMessage?:string):MethodDecorator {
  return (target, propertyKey, descriptor:TypedPropertyDescriptor<any>)=>{
    const { value } = descriptor;
    type TargetValue = typeof value
    type Param = ParamType<TargetValue>;
    type Return = ReturnType<TargetValue>
    descriptor.value = async function (this:any,param:Param):Promise<Return> {
      if(!param) param = {};
      param.successMessage = successMessage
      param.ErrorMessage = ErrorMessage
      try {
        const result  = await value.call(this,param);
        if(this.renderNotice) {
          this.renderNotice(param,result)
        }
        return result
      } catch (e) {
        this.renderNotice(param,e);
        throw e
      }
    }
  }
}
