import { ReactNode, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { LeadInput } from "@/services/leadService"
import { programService } from "@/services/programService"

interface Program {
  _id: string
  name: string
}

interface FieldProps {
  id: string
  label: string
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

function Field ({ id, label, className, children }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  )
}

export default function LeadForm () {
  const [lead, setLead] = useState<LeadInput>(EMPTY_LEAD)
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

  const change = (field: keyof LeadInput, value: string) => {
    setLead((current) => ({ ...current, [field]: value }))
  }

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
        <form className="flex flex-col gap-6" onSubmit={(event) => event.preventDefault()}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="first_name" label="Nombre">
              <Input
                id="first_name"
                value={lead.first_name}
                placeholder="Ej. María"
                autoComplete="given-name"
                autoCapitalize="words"
                onChange={(event) => change('first_name', event.target.value)}
              />
            </Field>
            <Field id="last_name" label="Apellido">
              <Input
                id="last_name"
                value={lead.last_name}
                placeholder="Ej. Gómez"
                autoComplete="family-name"
                autoCapitalize="words"
                onChange={(event) => change('last_name', event.target.value)}
              />
            </Field>
            <Field id="email" label="Correo electrónico">
              <Input
                id="email"
                type="email"
                value={lead.email}
                placeholder="Ej. maria.gomez@correo.com"
                autoComplete="email"
                onChange={(event) => change('email', event.target.value)}
              />
            </Field>
            <Field id="mobile_phone" label="Celular">
              <Input
                id="mobile_phone"
                type="tel"
                value={lead.mobile_phone}
                placeholder="Ej. 3001234567"
                autoComplete="tel-national"
                onChange={(event) => change('mobile_phone', event.target.value)}
              />
            </Field>
            <Field id="interestProgram" label="Programa de interés" className="md:col-span-2">
              <Select
                value={lead.interestProgram}
                disabled={programsStatus !== 'ready' || !programs.length}
                onValueChange={(value) => change('interestProgram', value)}
              >
                <SelectTrigger id="interestProgram" className="border-slate-200/75">
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
