import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { appState } from '@/framework/app-store'
import { getTreeIndex } from '@/framework/navigation'

const app = createApp(App)

// 生命周期/调度回调中的异常不能击穿调度器（否则整站静默冻结），统一记录即可
app.config.errorHandler = (err, _instance, info) => {
  console.error(`[原型系统] ${info}:`, err)
}

app.mount('#app')

// 原型调试出口：浏览器控制台可用 __pp 查看运行时树与状态
;(window as any).__pp = { appState, getTreeIndex }
