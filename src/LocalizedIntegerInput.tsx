import { useState } from 'react'
import { digitsOnly } from './localizedInteger'

type Props = {
  name: string
  language: string
  defaultValue: number
  maximum?: number
}

export function LocalizedIntegerInput({ name, language, defaultValue, maximum = Number.MAX_SAFE_INTEGER }: Props) {
  const [value, setValue] = useState(() => Math.min(defaultValue, maximum).toLocaleString(language))

  return <input
    name={name}
    type="text"
    required
    inputMode="numeric"
    autoComplete="off"
    value={value}
    onChange={(event) => {
      const digits = digitsOnly(event.target.value)
      const numericValue = digits ? Math.min(Number(digits), maximum) : 0
      setValue(digits ? numericValue.toLocaleString(language) : '')
    }}
  />
}