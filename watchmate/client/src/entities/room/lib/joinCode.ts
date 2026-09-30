export const JOIN_CODE_LENGTH = 6

// CONTRACT.md, раздел 2: верхний регистр, затем убрать `-` и пробелы
export const normalizeJoinCode = (input: string): string =>
  input.toUpperCase().replace(/[-\s]/g, '')

// Показ в формате XXX-XXX (работает и для неполного ввода)
export const formatJoinCode = (code: string): string => {
  const normalized = normalizeJoinCode(code).slice(0, JOIN_CODE_LENGTH)
  return normalized.length > 3
    ? `${normalized.slice(0, 3)}-${normalized.slice(3)}`
    : normalized
}
