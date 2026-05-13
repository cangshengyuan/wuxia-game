import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App skeleton', () => {
  it('renders core skeleton sections', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'Wuxia Game Skeleton' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '玩家信息' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '技能目录' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '战斗快照' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '执行一回合' })).toBeInTheDocument()
  })
})
