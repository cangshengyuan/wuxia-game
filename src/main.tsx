/**
 * @module main
 * @layer ui
 * @description 应用入口：挂载根组件到浏览器 DOM
 * @inputs App
 * @outputs 浏览器渲染入口
 * @depends ui
 * @forbidden 禁止 import engine、禁止在入口文件编排游戏业务规则、禁止直接修改全局状态
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
