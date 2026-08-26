const digitsOnly = (value: string) => value.replace(/[^0-9]/g, '')

export const parseLocalizedInteger = (value: FormDataEntryValue | null) => {
  const digits = digitsOnly(String(value ?? ''))
  return digits ? Number(digits) : 0
}

export { digitsOnly }