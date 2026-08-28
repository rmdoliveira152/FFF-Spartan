import { useState } from 'react'
import { unitMultiplier } from './formationPower'

type Unit = keyof typeof unitMultiplier

const defaultUnit = (value: number): Unit => value >= unitMultiplier.G ? 'G' : value >= unitMultiplier.M ? 'M' : 'K'

type Props = {
  name: string
  defaultValue: number
}

export function FormationPowerInput({ name, defaultValue }: Props) {
  const initialUnit = defaultUnit(defaultValue)
  const [unit, setUnit] = useState<Unit>(initialUnit)
  const [value, setValue] = useState(() => String(Number((defaultValue / unitMultiplier[initialUnit]).toFixed(1))))

  return <span className="formation-power-input">
    <input
      name={name}
      type="text"
      required
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={(event) => {
        const nextValue = event.target.value
        if (/^\d*(?:[.,]\d?)?$/.test(nextValue)) setValue(nextValue)
      }}
    />
    <select name={`${name}Unit`} value={unit} onChange={(event) => setUnit(event.target.value as Unit)} aria-label={`${name} unit`}>
      {(['K', 'M', 'G'] as const).map((option) => <option value={option} key={option}>{option}</option>)}
    </select>
  </span>
}