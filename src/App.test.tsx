/**
 * @module App.test
 * @layer ui
 * @description 根组件测试：验证默认入口页渲染正确
 * @inputs App
 * @outputs 测试断言
 * @depends test, ui
 * @forbidden 禁止在测试中绕过 store 直接修改 UI 内部状态
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App skeleton', () => {
  it('renders scene page as default entry', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '主城新手村' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '村口剑客' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '探索' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '村外野径' })).toBeInTheDocument()
  })
})
