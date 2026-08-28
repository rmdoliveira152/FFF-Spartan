type Unit = 'K' | 'M' | 'G'

export const unitMultiplier: Record<Unit, number> = { K: 1_000, M: 1_000_000, G: 1_000_000_000 }

export const formatCompactPower = (value: number, language: string) => {
  const absoluteValue = Math.abs(value)
  const unit: Unit | null = absoluteValue >= unitMultiplier.G ? 'G'
    : absoluteValue >= unitMultiplier.M ? 'M'
      : absoluteValue >= unitMultiplier.K ? 'K'
        : null
  const displayValue = unit ? value / unitMultiplier[unit] : value
  return `${new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(displayValue)}${unit ?? ''}`
}

export const parseFormationPower = (value: FormDataEntryValue | null, unit: FormDataEntryValue | null) => {
  const amount = Number(String(value ?? '').replace(',', '.'))
  const multiplier = unitMultiplier[String(unit) as Unit]
  return Number.isFinite(amount) && amount >= 0 && multiplier
    ? Math.min(Math.round(amount * multiplier), Number.MAX_SAFE_INTEGER)
    : 0
}