import Vue from 'vue'
import App from './App.vue'
import ViewUI from 'iview';
import 'iview/dist/styles/iview.css'
Vue.use(ViewUI);
Vue.config.productionTip = false
window.$Spin = Vue.prototype.$Spin
new Vue({
  render: h => h(App),
}).$mount('#app')
