export const symbolPrefix = Symbol('prefix')
export const symbolUnit = Symbol('symbolUnit')
export const symbolSend = Symbol('symbolSend')
export const symbolUnLink = Symbol('symbolUnLink')
export const symbolGlobalInterceptor = Symbol('GlobalInterceptor')

export function GlobalInterceptor(instance: IInterceptorInstance): ClassDecorator {
  return (target: any) => {
    if (target.prototype.send) {
      const value = target.prototype.send

      type TargetValue = typeof value
      type Return = ReturnType<TargetValue>
      type Param = ParamType<TargetValue>
      type Aop = typeof instance.intercept
      let interceptors: Aop[] = target.prototype[symbolGlobalInterceptor]
      target.prototype[symbolSend] = target.prototype.send
      if (!interceptors || !Array.isArray(interceptors)) {
        interceptors = []
      }
      interceptors.push(instance.intercept.bind(instance))
      target.prototype[symbolGlobalInterceptor] = interceptors
      target.prototype.send = function(...arg: Param): Return {
        const currentHandle = value.bind(this)
        console.info('global', this)
        const unLink = target.prototype[symbolUnLink]
        if (unLink) {
          target.prototype[symbolUnLink] = false
          return currentHandle(arg)
        }
        let [params] = arg
        if (!params) {
          params = {}
        }
        let currentInterceptors: Aop[] = target.prototype[symbolGlobalInterceptor]
        if (typeof params.interceptors === 'function') {
          currentInterceptors = params.interceptors(currentInterceptors)
        }
        if (currentInterceptors.length < 1) {
          return value.apply(this, arg)
        }
        return currentInterceptors.reduce((res, handle) => {
          return handle(currentHandle, arg) as Return
        }, undefined)
      }
    }

    return target
  }
}

export function UseInterceptor(instance: IInterceptorInstance, unLink?: boolean): MethodDecorator {
  return (target: any, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor

    type TargetValue = typeof value
    type Return = ReturnType<TargetValue>
    type Aop = typeof instance.intercept
    // 如果设置了全局拦截器合并在一起
    target.constructor.prototype[symbolUnLink] = unLink
    descriptor.value = async function(...arg: any[]): Promise<Return> {
      let handler = value.bind(this)
      if (unLink) {
        handler = target.constructor.prototype[symbolSend]
        return instance.intercept(handler.bind(this), arg) as Return
      }
      const interceptors: Aop[] | undefined = target.constructor.prototype[symbolGlobalInterceptor]
      if (Array.isArray(interceptors)) {
        interceptors.unshift(instance.intercept.bind(instance))
        return value.apply(this, arg)
      }
      return instance.intercept(handler, arg) as Return
    }
  }
}

export function GlobalExceptionFilter(
  instance: IExceptionFilter,
  truncation?: boolean
): ClassDecorator {
  return (target: any) => {
    if (target.prototype.send) {
      const value = target.prototype.send

      type TargetValue = typeof value
      type Return = ReturnType<TargetValue>
      type Param = ParamType<TargetValue>
      target.prototype.send = function(...arg: Param): Return {
        try {
          return value.bind(this)(...arg)
        } catch (e) {
          if (truncation) {
            return instance.catch(this, e)
          } else {
            instance.catch(this, e)
          }
          throw e
        }
      }
    }

    return target
  }
}

export function UseExceptionFilter(
  instance: IExceptionFilter,
  truncation?: boolean
): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor

    type TargetValue = typeof value
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(...params: any[]): Promise<Return> {
      try {
        return await value.bind(this)(...params)
      } catch (e) {
        if (truncation) {
          return instance.catch(this, e)
        } else {
          instance.catch(this, e)
        }
        throw e
      }
    }
  }
}

/**
 *
 * @param instance
 * @param truncation 是否截断异常，如果截断那么后续走正常流程，异常在这里被截断，并且会返回instance.catch的返回值作为新的返回值
 * @constructor
 */
export function CodeExceptionFilter(
  instance: ICodeExceptionFilter,
  truncation?: boolean
): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor

    type TargetValue = typeof value
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(...params: any[]): Promise<Return> {
      try {
        return await value.bind(this)(...params)
      } catch (e) {
        if (
          instance &&
          typeof instance.discernCode === 'function' &&
          instance.discernCode(e, ...params)
        ) {
          if (truncation) {
            return instance.catch(this, e, ...params) as Return
          } else {
            instance.catch(this, e, ...params)
          }
        }
        throw e
      }
    }
  }
}

export function PipeTransform(instance: IPipeTransform): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor

    type TargetValue = typeof value
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(...params: any[]): Promise<Return> {
      const [param = {}, ...other] = params
      param.data = instance.transform(param.data)
      return value.bind(this)(...[param, ...other])
    }
  }
}

// 装饰器controller
export const Controller = (path?: string, unit?: string) => {
  return (target: any) => {
    target.prototype[symbolPrefix] = path
    // 连接符
    target.prototype[symbolUnit] = unit
  }
}

export function Path(url: string, unLink?: boolean): MethodDecorator {
  return (target: any, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor

    type TargetValue = typeof value
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(...params: any[]): Promise<Return> {
      let [param] = params

      params.shift()
      const prefix: string = target[symbolPrefix] || ''
      const unit: string = target[symbolUnit] || '/'

      if (!param) {
        param = {}
      }
      const prefixUrl = prefix.endsWith(unit) ? prefix : prefix + unit

      param.url = unLink ? url : prefixUrl + url

      return value.apply(this, [param].concat(params))
    }
  }
}

export abstract class CommonInterceptor implements IInterceptorInstance {
  // 加上这个装饰器在发送请求前会显示一个loading
  public static Loading(message?: string): MethodDecorator {
    return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
      const { value } = descriptor

      type TargetValue = typeof value
      type Return = ReturnType<TargetValue>
      descriptor.value = async function(...params: any[]): Promise<Return> {
        const [param, ...other] = params
        const defaultParam = {
          ...param,
          showLoading: true,
          loadingMessage: message || '加载中...'
        }

        return value.apply(this, [defaultParam, ...other])
      }
    }
  }

  public static ShowNotice(message?: string): MethodDecorator {
    return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
      const { value } = descriptor

      type TargetValue = typeof value
      type Return = ReturnType<TargetValue>
      descriptor.value = async function(...params: any[]): Promise<Return> {
        const [param, ...other] = params
        const defaultParam = {
          ...param,
          noticeMessage: message,
          showNotice: true
        }

        return value.apply(this, [defaultParam, ...other])
      }
    }
  }

  public static ErrorNotice(message?: string): MethodDecorator {
    return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
      const { value } = descriptor
      type TargetValue = typeof value
      type Return = ReturnType<TargetValue>
      descriptor.value = async function(...params: any[]): Promise<Return> {
        const [param, ...other] = params
        const defaultParam = {
          ...param,
          noticeErrorMessage: message,
          showErrorNotice: true
        }
        return value.apply(this, [defaultParam, ...other])
      }
    }
  }

  public async intercept(handle: Function, arg: any[]) {
    const [params = {}, ...other] = arg
    const {
      showLoading,
      showNotice,
      showErrorNotice,
      closeLoading,
      closeShowNotice,
      closeErrorNotice
    } = params

    if (showLoading && !closeLoading) {
      await this.renderLoading(params)
    }
    try {
      const result = await handle(params, ...other)
      if (showNotice && !closeShowNotice) {
        await this.renderNotice(result, params)
      }
      return result
    } catch (e) {
      console.error('intercept:', e)
      if (showErrorNotice && !closeErrorNotice) {
        await this.renderErrorNotice(e, params)
      }
      throw e
    } finally {
      await this.closeLoading()
    }
  }

  protected abstract async renderLoading(params: any): Promise<any>

  protected abstract async closeLoading(params?: any): Promise<any>

  protected abstract async renderNotice(result: any, params?: any): Promise<any>

  protected abstract async renderErrorNotice(error: any, params?: any): Promise<any>
}

export function ValidationPipe(instance: IValidationPipe, meta: any): MethodDecorator {
  return (target, propertyKey, descriptor: TypedPropertyDescriptor<any>) => {
    const { value } = descriptor

    type TargetValue = typeof value
    type Return = ReturnType<TargetValue>
    descriptor.value = async function(...params: any[]): Promise<Return> {
      const [param = {}, ...other] = params
      if (await instance.validate(params)) {
        param.data = instance.transform(param.data)
        return value.bind(this)(...[param, ...other])
      }
      throw false
    }
  }
}
