import { app } from "@/atoms/kuepa"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import LeadForm from "./lead-form"
import RecentLeads from "./recent-leads"

export interface LeadsProps {
}

export default function Leads (props?: LeadsProps) {
  const [lastCreatedId, setLastCreatedId] = useState<string>(null)

  useEffect(() => {
    app.set({
      ...(app.get() || {}),
      app: 'kuepa',
      module: 'leads',
      window: 'crm',
      back: null,
      accent: 'purple',
      breadcrumb:[
        {
          title: 'Leads',
          url: '/leads'
        }
      ]
    })
  }, [])
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 pt-6 pb-6 md:pt-0">
      <div className="flex flex-col gap-1">
        <h1 className="flex text-3xl md:text-4xl font-title text-purple-800">Leads</h1>
        <p className="text-sm text-muted-foreground">Registra a los prospectos interesados en los programas académicos de Kuepa.</p>
      </div>
      <LeadForm onCreated={setLastCreatedId} />
      <RecentLeads lastCreatedId={lastCreatedId} />
    </div>
  )
}