const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

interface IPagination {
  page: number
  pageSize: number
  skip: number
  fields: string[]
}

class PaginationUtility {

  constructor() {}

  public parse (_params): IPagination {
    const page = this.toPositiveInteger(_params.page, DEFAULT_PAGE)
    const page_size = this.toPositiveInteger(_params.pageSize, DEFAULT_PAGE_SIZE)

    const fields: string[] = []
    if(!page) fields.push('page')
    if(!page_size) fields.push('pageSize')
    if(fields.length) return { page: null, pageSize: null, skip: null, fields }

    const size = Math.min(page_size, MAX_PAGE_SIZE)
    return { page, pageSize: size, skip: (page - 1) * size, fields }
  }

  public meta (page: number, pageSize: number, total: number) {
    const total_pages = Math.ceil(total / pageSize)
    return {
      page,
      pageSize,
      total,
      totalPages: total_pages,
      hasNext: page < total_pages,
      hasPrev: page > 1
    }
  }

  private toPositiveInteger (value, fallback: number) {
    if(value === undefined || value === '') return fallback
    const parsed = Number(value)
    return Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : null
  }
}

export const paginationUtility = new PaginationUtility()
export { PaginationUtility, IPagination }
