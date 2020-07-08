import { IAxiosSend, ProxySend, Loading } from 'anysend/dist/anysend.es5'

import axios from 'axios'
@ProxySend({
  before(){
    console.info('调用前')
  },
  after(){},
  renderLoading(){
    console.info('render',window.$Spin)
    console.info(this)
  }
})
class AxiosSend extends IAxiosSend{
  init(config, plugin) {
    return super.init(config, plugin)
  }
  isSuccess(result) {
    return result
  }
  transformData(result) {
    return result
  }
  interceptorError(error) {
    console.info(error)
  }
  interceptorRequest(res) {
    return res
  }
  interceptorResponse(response) {
    return response

  }
  @Loading('sss')
  list(){}
}
const a = new AxiosSend({},axios)
console.info(a.list());
