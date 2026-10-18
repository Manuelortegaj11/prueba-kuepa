import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Lead, leadService } from "@/services/leadService"
import { formatDateTime, formatPhone } from "@/util/utils"

export interface RecentLeadsProps {
  lastCreatedId?: string
}

const PAGE_SIZE = 10
const SKELETON_ROWS = 5
const COLUMN_COUNT = 5

const COLUMN_VISIBILITY = {
  phone: "hidden sm:table-cell",
  program: "hidden md:table-cell",
  date: "hidden lg:table-cell"
}

export default function RecentLeads ({ lastCreatedId }: RecentLeadsProps) {
  const [leads, setLeads] = useState<Lead[]>(null)
  const [failed, setFailed] = useState(false)

  const loadLeads = async () => {
    setFailed(false)
    const response = await leadService.list({ page: 1, pageSize: PAGE_SIZE })
    if(response?.code === 200){
      setLeads(response.list)
    } else {
      setFailed(true)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [lastCreatedId])

  const renderRows = () => {
    if(failed){
      return (
        <TableRow>
          <TableCell colSpan={COLUMN_COUNT} className="py-8 text-center text-muted-foreground">
            No se pudieron cargar los leads.
            <Button variant="link" className="h-auto p-0 pl-1 text-purple-800" onClick={loadLeads}>Reintentar</Button>
          </TableCell>
        </TableRow>
      )
    }

    if(!leads){
      return Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
          <TableCell className={COLUMN_VISIBILITY.phone}><Skeleton className="h-4 w-24" /></TableCell>
          <TableCell className={COLUMN_VISIBILITY.program}><Skeleton className="h-4 w-36" /></TableCell>
          <TableCell className={COLUMN_VISIBILITY.date}><Skeleton className="h-4 w-28" /></TableCell>
        </TableRow>
      ))
    }

    if(!leads.length){
      return (
        <TableRow>
          <TableCell colSpan={COLUMN_COUNT} className="py-8 text-center text-muted-foreground">
            Aún no hay leads registrados. Los que registres aparecerán aquí.
          </TableCell>
        </TableRow>
      )
    }

    return leads.map((lead) => (
      <TableRow key={lead._id} className={cn(lead._id === lastCreatedId && "bg-purple-50 animate-fade-in")}>
        <TableCell className="font-medium tabular-nums text-purple-800">#{lead.incremental}</TableCell>
        <TableCell>
          <div className="font-medium">{lead.full_name}</div>
          <div className="break-all text-xs text-muted-foreground">{lead.email}</div>
        </TableCell>
        <TableCell className={cn(COLUMN_VISIBILITY.phone, "whitespace-nowrap tabular-nums")}>{formatPhone(lead.mobile_phone)}</TableCell>
        <TableCell className={COLUMN_VISIBILITY.program}>{lead.interestProgram?.name ?? '—'}</TableCell>
        <TableCell className={cn(COLUMN_VISIBILITY.date, "whitespace-nowrap text-muted-foreground")}>{formatDateTime(lead.created_at)}</TableCell>
      </TableRow>
    ))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg text-purple-800">Últimos leads registrados</CardTitle>
        <CardDescription>Los {PAGE_SIZE} más recientes, del más nuevo al más antiguo.</CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Table aria-label="Últimos leads registrados" aria-busy={!leads && !failed}>
          <TableHeader>
            <TableRow>
              <TableHead>N.º</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className={COLUMN_VISIBILITY.phone}>Celular</TableHead>
              <TableHead className={COLUMN_VISIBILITY.program}>Programa</TableHead>
              <TableHead className={COLUMN_VISIBILITY.date}>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderRows()}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
