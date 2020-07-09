import 'reflect-metadata'
import { getIn } from './Helper'
export function ProxySend(proxy: any): ClassDecorator {
  return function(target) {
    Object.keys(proxy).forEach(name => {
      target.prototype[name] = proxy[name]
    })
    return target
  }
}
export function Controller(path: string): ClassDecorator {
  return target => {
    Reflect.defineMetadata('Controller', path, target.prototype)
    return target
  }
}
export function UnLink(link = true): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor
    type TargetValue = typeof value
    type Return = ReturnType<TargetValue>

    if (link) {
      descriptor.value = async function(...params: any[]): Promise<Return> {
        const path: string = Reflect.getMetadata('Path', target) || ''
        let [param] = params
        params.shift()
        param.url = path
        return value.apply(this, [param].concat(params))
      }
    }
  }
}

export function Unit(mark: string): ClassDecorator {
  return target => {
    Reflect.defineMetadata('Unit', mark, target.prototype)
    return target
  }
}
const handlerAOP: Function = (param: any, key: string, context: any) => {
  const handle: any = getIn(param, [key])
  const contextHandle: any = getIn(context, [key])
  if (typeof handle === 'function') {
    return <Function>handle.bind(context)
  } else if (typeof contextHandle === 'function') {
    return <Function>contextHandle.bind(context)
  }
  return () => {}
}
export function Path(url: string): MethodDecorator {
  return (target: any, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor
    type TargetValue = typeof value
    type Return = ReturnType<TargetValue>
    Reflect.defineMetadata('Path', url, target)
    descriptor.value = async function(...params: any[]): Promise<Return> {
      url = url + ''
      let [param] = params
      params.shift()
      const prefix: string = Reflect.getMetadata('Controller', this) || ''
      const unit: string = Reflect.getMetadata('Unit', this) || '/'
      if (!param) param = {}
      const suffixUrl = url.startsWith(unit) ? url : unit + url
      param.url = prefix + suffixUrl
      return value.apply(this, [param].concat(params))
    }
  }
}
export function Aop(before?: IAopParam, after?: IAopParam): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor
    type TargetValue = typeof value
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(...params: any[]): Promise<Return> {
      //第一个必须是配置参数
      let [param] = params
      params.shift()
      if (!param) param = {}
      if (typeof before === 'string') {
        param.beforeMessage = before
      }
      // 装饰器优先  => 参数的 => 全局的
      if (!param.closeBefore) {
        if (typeof before === 'function') {
          await before.apply(this, params)
        } else {
          await handlerAOP(param, 'before', this)(param)
        }
      }
      try {
        const result: Return = await value.apply(this, [param].concat(params))
        if (!param.closeAfter) {
          if (typeof after === 'function') {
            await after.call(this, param)
          } else {
            await handlerAOP(param, 'after', this)(result, param)
          }
        }
        return result
      } catch (e) {
        throw e
      }
    }
  }
}
// 渲染loading
export function Loading(message: string): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor
    type TargetValue = typeof value
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(this: any, ...params: any[]): Promise<Return> {
      let [param] = params
      params.shift()
      if (!param) param = {}
      param.loadingMessage = message
      if (this.renderLoading) {
        await this.renderLoading(param)
      }
      try {
        return value.apply(this, [param].concat(params))
      } catch (e) {
        throw e
      } finally {
        if (this.closeLoading) {
          this.closeLoading(param)
        }
      }
    }
  }
}

export function ShowNotice(successMessage?: string, errorMessage?: string): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor
    type TargetValue = typeof value
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(this: any, ...params: any[]): Promise<Return> {
      let [param] = params
      params.shift()
      if (!param) param = {}
      param.successMessage = successMessage
      param.errorMessage = errorMessage
      try {
        const result = await value.apply(this, [param].concat(params))
        if (this.renderNotice) {
          this.renderNotice(param, result)
        }
        return result
      } catch (e) {
        this.renderNotice(param, e)
        throw e
      }
    }
  }
}
