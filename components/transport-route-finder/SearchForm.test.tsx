import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from './SearchForm'

describe('SearchForm', () => {
  it('clears from field after clear button click', async () => {
    const user = userEvent.setup()
    render(<SearchForm initialValues={{ from: '서울역', to: '강남역' }} onSearch={vi.fn()} onClear={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '지우기' }))

    expect(screen.getByPlaceholderText('출발지 입력')).toHaveValue('')
  })

  it('clears to field after clear button click', async () => {
    const user = userEvent.setup()
    render(<SearchForm initialValues={{ from: '서울역', to: '강남역' }} onSearch={vi.fn()} onClear={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '지우기' }))

    expect(screen.getByPlaceholderText('목적지 입력')).toHaveValue('')
  })

  it('does not call onSearch when to field is empty', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchForm initialValues={{ from: '서울역', to: '' }} onSearch={onSearch} onClear={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '경로 검색' }))

    expect(onSearch).not.toHaveBeenCalled()
  })

  it('shows error message when to field is empty and search is clicked', async () => {
    const user = userEvent.setup()
    render(<SearchForm initialValues={{ from: '서울역', to: '' }} onSearch={vi.fn()} onClear={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '경로 검색' }))

    expect(screen.getByText('목적지를 입력해 주세요')).toBeInTheDocument()
  })
})
