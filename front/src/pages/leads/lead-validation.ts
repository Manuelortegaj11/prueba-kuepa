import { LeadInput } from "@/services/leadService"

export type LeadErrors = Partial<Record<keyof LeadInput, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_PHONE_PATTERN = /^3\d{9}$/

const LEAD_RULES: Record<keyof LeadInput, (value: string) => string> = {
  first_name: (value) => value ? '' : 'Ingresa el nombre.',
  last_name: (value) => value ? '' : 'Ingresa el apellido.',
  email: (value) => {
    if(!value) return 'Ingresa el correo electrónico.'
    return EMAIL_PATTERN.test(value) ? '' : 'Ingresa un correo válido, por ejemplo maria@correo.com.'
  },
  mobile_phone: (value) => {
    if(!value) return 'Ingresa el celular.'
    return MOBILE_PHONE_PATTERN.test(value) ? '' : 'El celular debe tener 10 dígitos y empezar por 3.'
  },
  interestProgram: (value) => value ? '' : 'Selecciona un programa de interés.'
}

export const LEAD_FIELDS = Object.keys(LEAD_RULES) as (keyof LeadInput)[]

export const validateField = (field: keyof LeadInput, value: string) => LEAD_RULES[field](value.trim())

export const validateLead = (lead: LeadInput) => {
  const errors: LeadErrors = {}
  LEAD_FIELDS.forEach((field) => {
    const error = validateField(field, lead[field])
    if(error) errors[field] = error
  })
  return errors
}

export const normalizeMobilePhone = (value: string) => {
  const digits = value.replace(/\D/g, '')
  const national = digits.length > 10 && digits.startsWith('57') ? digits.slice(2) : digits
  return national.slice(0, 10)
}
