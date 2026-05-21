'use client'

import { useState } from 'react'
import { MapPinIcon, FlagIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'

interface SearchFormProps {
  initialValues?: { from: string; to: string }
  onSearch: (from: string, to: string) => void
  onClear: () => void
  isLoading?: boolean
}

export function SearchForm({ initialValues, onSearch, onClear, isLoading }: SearchFormProps) {
  const [from, setFrom] = useState(initialValues?.from ?? '')
  const [to, setTo] = useState(initialValues?.to ?? '')
  const [errors, setErrors] = useState<{ from?: string; to?: string }>({})

  const handleClear = () => {
    setFrom('')
    setTo('')
    setErrors({})
    onClear()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { from?: string; to?: string } = {}
    if (!from.trim()) newErrors.from = '출발지를 입력해 주세요'
    if (!to.trim()) newErrors.to = '목적지를 입력해 주세요'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})
    onSearch(from.trim(), to.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <MapPinIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="출발지 입력"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-invalid={!!errors.from}
          />
        </InputGroup>
        {errors.from && (
          <p className="text-xs text-destructive ml-1">{errors.from}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <FlagIcon />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="목적지 입력"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-invalid={!!errors.to}
          />
        </InputGroup>
        {errors.to && (
          <p className="text-xs text-destructive ml-1">{errors.to}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isLoading}>
          {isLoading ? '검색 중...' : '경로 검색'}
        </Button>
        <Button type="button" variant="outline" onClick={handleClear} disabled={isLoading}>
          지우기
        </Button>
      </div>
    </form>
  )
}
