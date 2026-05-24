import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App skeleton', () => {
  it('renders scene page as default entry', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '主城新手村' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '村口剑客' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '探索' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '前往村外野径' })).toBeInTheDocument()
  })
})
