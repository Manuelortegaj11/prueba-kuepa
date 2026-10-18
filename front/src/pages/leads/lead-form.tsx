import { ChangeEvent, FormEvent, ReactNode, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { LeadInput } from "@/services/leadService"
import { programService } from "@/services/programService"
import { LEAD_FIELDS, LeadErrors, normalizeMobilePhone, validateField, validateLead } from "./lead-validation"

interface Program {
  _id: string
  name: string
}

interface FieldProps {
  id: string
  label: string
  error?: string
  className?: string
  children: ReactNode
}

const EMPTY_LEAD: LeadInput = {
  first_name: '',
  last_name: '',
  email: '',
  mobile_phone: '',
  interestProgram: ''
}

const INVALID_CLASS = "border-red-500 focus:ring-red-500 focus-visible:ring-red-500"

function Field ({ id, label, error, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {
        error ?
          <p id={`${id}-error`} className="text-xs text-red-600">{error}</p>
        : null
      }
    </div>
  )
}

export default function LeadForm () {
  const [lead, setLead] = useState<LeadInput>(EMPTY_LEAD)
  const [errors, setErrors] = useState<LeadErrors>({})
  const [programs, setPrograms] = useState<Program[]>([])
  const [programsStatus, setProgramsStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const loadPrograms = async () => {
    setProgramsStatus('loading')
    const response = await programService.list()
    if(response?.code === 200){
      setPrograms(response.list)
      setProgramsStatus('ready')
    } else {
      setProgramsStatus('error')
    }
  }

  useEffect(() => {
    loadPrograms()
  }, [])

  const handleChange = (field: keyof LeadInput, value: string) => {
    const nextValue = field === 'mobile_phone' ? normalizeMobilePhone(value) : value
    setLead((current) => ({ ...current, [field]: nextValue }))
    if(errors[field]) setErrors((current) => ({ ...current, [field]: validateField(field, nextValue) }))
  }

  const handleBlur = (field: keyof LeadInput) => {
    if(lead[field].trim()) setErrors((current) => ({ ...current, [field]: validateField(field, lead[field]) }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const foundErrors = validateLead(lead)
    setErrors(foundErrors)
    const invalidField = LEAD_FIELDS.find((field) => foundErrors[field])
    if(invalidField) document.getElementById(invalidField)?.focus()
  }

  const errorProps = (field: keyof LeadInput) => ({
    'aria-invalid': Boolean(errors[field]),
    'aria-describedby': errors[field] ? `${field}-error` : undefined
  })

  const inputProps = (field: keyof LeadInput) => ({
    id: field,
    value: lead[field],
    className: cn(errors[field] && INVALID_CLASS),
    onBlur: () => handleBlur(field),
    onChange: (event: ChangeEvent<HTMLInputElement>) => handleChange(field, event.target.value),
    ...errorProps(field)
  })

  const programPlaceholder = () => {
    if(programsStatus === 'loading') return 'Cargando programas...'
    if(programsStatus === 'error') return 'No se pudieron cargar los programas'
    if(!programs.length) return 'No hay programas disponibles'
    return 'Selecciona un programa'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-purple-800">Nuevo lead</CardTitle>
        <CardDescription>Completa los datos del prospecto. Todos los campos son obligatorios.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <form noValidate className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="first_name" label="Nombre" error={errors.first_name}>
              <Input
                {...inputProps('first_name')}
                placeholder="Ej. María"
                autoComplete="given-name"
                autoCapitalize="words"
              />
            </Field>
            <Field id="last_name" label="Apellido" error={errors.last_name}>
              <Input
                {...inputProps('last_name')}
                placeholder="Ej. Gómez"
                autoComplete="family-name"
                autoCapitalize="words"
              />
            </Field>
            <Field id="email" label="Correo electrónico" error={errors.email}>
              <Input
                {...inputProps('email')}
                type="email"
                placeholder="Ej. maria.gomez@correo.com"
                autoComplete="email"
              />
            </Field>
            <Field id="mobile_phone" label="Celular" error={errors.mobile_phone}>
              <Input
                {...inputProps('mobile_phone')}
                type="tel"
                inputMode="numeric"
                placeholder="Ej. 3001234567"
                autoComplete="tel-national"
              />
            </Field>
            <Field id="interestProgram" label="Programa de interés" error={errors.interestProgram} className="md:col-span-2">
              <Select
                value={lead.interestProgram}
                disabled={programsStatus !== 'ready' || !programs.length}
                onValueChange={(value) => handleChange('interestProgram', value)}
              >
                <SelectTrigger
                  id="interestProgram"
                  className={cn("border-slate-200/75", errors.interestProgram && INVALID_CLASS)}
                  {...errorProps('interestProgram')}
                >
                  <SelectValue placeholder={programPlaceholder()} />
                </SelectTrigger>
                <SelectContent>
                  {
                    programs.map((program) => (
                      <SelectItem key={program._id} value={program._id}>{program.name}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              {
                programsStatus === 'error' ?
                  <Button type="button" variant="link" className="h-auto w-fit p-0 text-purple-800" onClick={loadPrograms}>
                    Reintentar
                  </Button>
                : null
              }
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" tone="purple" className="w-full sm:w-auto">Registrar lead</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
