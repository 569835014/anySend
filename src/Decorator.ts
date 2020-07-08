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
    Reflect.defineMetadata('Controller', path, target)
  }
}
export function Unit(mark: string): ClassDecorator {
  return target => {
    Reflect.defineMetadata('Unit', mark, target)
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
export function Aop(before?: IAopParam, after?: IAopParam): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const prefix: string = Reflect.getMetadata('Controller', target) || ''
    const unit: string = Reflect.getMetadata('Unit', target) || ''
    const { value } = descriptor
    type TargetValue = typeof value
    type Param = ParamType<TargetValue>
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(param: Param): Promise<Return> {
      if (!param) param = {}
      const prefixUrl = prefix.endsWith(unit) ? prefix : prefix + unit
      param.url += prefixUrl
      if (typeof before === 'string') {
        param.beforeMessage = before
      }
      // 装饰器优先  => 参数的 => 全局的
      if (!param.closeBefore) {
        if (typeof before === 'function') {
          await before.call(this, param)
        } else {
          await handlerAOP(param, 'before', this)(param)
        }
      }
      const result: Return = await value.call(this, param)
      if (!param.closeAfter) {
        if (typeof after === 'function') {
          await after.call(this, param)
        } else {
          await handlerAOP(param, 'after', this)(result, param)
        }
      }
      return result
    }
  }
}
// 渲染loading
export function Loading(message: string): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor
    type TargetValue = typeof value
    type Param = ParamType<TargetValue>
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(this: any, param: Param): Promise<Return> {
      if (!param) param = {}
      param.loadingMessage = message
      if (this.renderLoading) {
        await this.renderLoading(param)
      }
      try {
        return value.call(this, param)
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
    type Param = ParamType<TargetValue>
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(this: any, param: Param): Promise<Return> {
      if (!param) param = {}
      param.successMessage = successMessage
      param.errorMessage = errorMessage
      try {
        const result = await value.call(this, param)
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
