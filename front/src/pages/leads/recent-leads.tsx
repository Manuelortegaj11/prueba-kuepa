import { useEffect, useState } from "react"
import { TbChevronLeft, TbChevronRight, TbSearch } from "react-icons/tb"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Lead, leadService, PaginationMeta } from "@/services/leadService"
import { formatDateTime, formatPhone } from "@/util/utils"

export interface RecentLeadsProps {
  lastCreatedId?: string
}

const PAGE_SIZE = 10
const SEARCH_DELAY = 300
const SKELETON_ROWS = 5
const COLUMN_COUNT = 5

const COLUMN_VISIBILITY = {
  phone: "hidden sm:table-cell",
  program: "hidden md:table-cell",
  date: "hidden lg:table-cell"
}

export default function RecentLeads ({ lastCreatedId }: RecentLeadsProps) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({ search: '', page: 1 })
  const [leads, setLeads] = useState<Lead[]>(null)
  const [pagination, setPagination] = useState<PaginationMeta>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const loadLeads = async (signal?: AbortSignal) => {
    setLoading(true)
    setFailed(false)
    const response = await leadService.list({ page: filters.page, pageSize: PAGE_SIZE, search: filters.search || undefined }, signal)
    if(signal?.aborted) return
    if(response?.code === 200){
      setLeads(response.list)
      setPagination(response.pagination)
    } else {
      setFailed(true)
    }
    setLoading(false)
  }

  const clearSearch = () => {
    setQuery('')
    setFilters({ search: '', page: 1 })
  }

  const goToPage = (page: number) => {
    setFilters((current) => current.page === page ? current : { ...current, page })
  }

  useEffect(() => {
    const controller = new AbortController()
    loadLeads(controller.signal)
    return () => controller.abort()
  }, [filters])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const search = query.trim()
      setFilters((current) => current.search === search ? current : { search, page: 1 })
    }, SEARCH_DELAY)
    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    if(lastCreatedId) clearSearch()
  }, [lastCreatedId])

  const summary = () => {
    if(!pagination) return 'Del más reciente al más antiguo.'
    const total = `${pagination.total} ${pagination.total === 1 ? 'lead' : 'leads'}`
    return filters.search ? `${total} para “${filters.search}”.` : `${total} en total, del más reciente al más antiguo.`
  }

  const renderRows = () => {
    if(failed){
      return (
        <TableRow>
          <TableCell colSpan={COLUMN_COUNT} className="py-8 text-center text-muted-foreground">
            No se pudieron cargar los leads.
            <Button variant="link" className="h-auto p-0 pl-1 text-purple-800" onClick={() => loadLeads()}>Reintentar</Button>
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
            {
              filters.search ?
                <>
                  No hay leads que coincidan con “{filters.search}”.
                  <Button variant="link" className="h-auto p-0 pl-1 text-purple-800" onClick={clearSearch}>Limpiar búsqueda</Button>
                </>
              : 'Aún no hay leads registrados. Los que registres aparecerán aquí.'
            }
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
        <CardTitle className="text-lg text-purple-800">Leads registrados</CardTitle>
        <CardDescription>{summary()}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4 pt-0">
        <div className="relative md:max-w-sm">
          <TbSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={query}
            placeholder="Buscar por nombre, correo, celular o N.º"
            aria-label="Buscar leads"
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <Table aria-label="Leads registrados" aria-busy={loading}>
          <TableHeader>
            <TableRow>
              <TableHead>N.º</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className={COLUMN_VISIBILITY.phone}>Celular</TableHead>
              <TableHead className={COLUMN_VISIBILITY.program}>Programa</TableHead>
              <TableHead className={COLUMN_VISIBILITY.date}>Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className={cn("transition-opacity", loading && leads && "opacity-60")}>
            {renderRows()}
          </TableBody>
        </Table>
        {
          pagination?.totalPages > 1 ?
            <Pagination aria-label="Paginación de leads" className="items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">Página {pagination.page} de {pagination.totalPages}</p>
              <PaginationContent>
                <PaginationItem>
                  <Button variant="outline" size="sm" className="border-slate-200" disabled={!pagination.hasPrev} onClick={() => goToPage(pagination.page - 1)}>
                    <TbChevronLeft />
                    Anterior
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button variant="outline" size="sm" className="border-slate-200" disabled={!pagination.hasNext} onClick={() => goToPage(pagination.page + 1)}>
                    Siguiente
                    <TbChevronRight />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          : null
        }
      </CardContent>
    </Card>
  )
}
