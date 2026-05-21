'use client'

import { useState } from 'react'
import { MapPinIcon, FlagIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchFormProps {
  initialValues?: { from: string; to: string }
  onSearch: (from: string, to: string) => void
  onClear: () => void
}

export function SearchForm({ initialValues, onSearch, onClear }: SearchFormProps) {
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
        <div className="relative flex items-center">
          <MapPinIcon className="absolute left-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="출발지 입력"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className={cn('pl-8', errors.from && 'border-destructive')}
            aria-invalid={!!errors.from}
          />
        </div>
        {errors.from && (
          <p className="text-xs text-destructive ml-1">{errors.from}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <div className="relative flex items-center">
          <FlagIcon className="absolute left-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="목적지 입력"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className={cn('pl-8', errors.to && 'border-destructive')}
            aria-invalid={!!errors.to}
          />
        </div>
        {errors.to && (
          <p className="text-xs text-destructive ml-1">{errors.to}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          경로 검색
        </Button>
        <Button type="button" variant="outline" onClick={handleClear}>
          지우기
        </Button>
      </div>
    </form>
  )
}
