export const getIn = <T>(target: any, keys: string[], defaultValue?: T) => {
  try {
    const res = keys.reduce((res, key) => {
      res = res[key]
      return res
    }, target)
    if (res === undefined || res === null) return defaultValue
    return res as T
  } catch (e) {
    return defaultValue
  }
}
