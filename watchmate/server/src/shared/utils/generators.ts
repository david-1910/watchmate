import { randomBytes, randomInt, randomUUID } from 'crypto'
import { JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH } from '../constants/limits'

export const generateId = (): string => randomUUID()

// 48 hex-символов: hostToken и memberToken
export const generateSecretToken = (): string => randomBytes(24).toString('hex')

export const generateJoinCode = (): string =>
  Array.from({ length: JOIN_CODE_LENGTH }, () => JOIN_CODE_ALPHABET[randomInt(JOIN_CODE_ALPHABET.length)]).join('')
