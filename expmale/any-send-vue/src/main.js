import Vue from 'vue'
import App from './App.vue'
import ViewUI from 'iview';
Vue.use(ViewUI);
Vue.config.productionTip = false
console.info(1)
window.$Spin = Vue.prototype.$Spin
console.info(window.$Spin)
new Vue({
  render: h => h(App),
}).$mount('#app')
