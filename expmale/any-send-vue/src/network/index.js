import { IAxiosSend, ProxySend, Loading, Path, Controller, Unit, UnLink } from 'anysend/dist/anysend.es5'

import axios from 'axios'
@ProxySend({
  before(){
    console.info('调用前')
  },
  after(){},
  renderLoading(){
   if(window.$Spin){
     window.$Spin.show();
   }
  },
  closeLoading(){
    console.info(arguments)
    if(window.$Spin){
      setTimeout(()=>{
        window.$Spin.hide()
      },500)
    }
  }
})
@Controller('/dev')
@Unit('.')

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
  @Path('api')
  @UnLink()
  list(options){
    return this.send(options);
  }
}
export default new AxiosSend({},axios)
