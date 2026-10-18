import { get, post } from "../util/http"
const api = '/lead'

export interface LeadInput {
  first_name: string
  last_name: string
  email: string
  mobile_phone: string
  interestProgram: string
}

export interface Lead {
  _id: string
  incremental: number
  full_name: string
  email: string
  mobile_phone: string
  interestProgram: { _id: string, name: string } | null
  created_at: string
}

export interface LeadListParams {
  page?: number
  pageSize?: number
  search?: string
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export const leadService = {
  api,
  get: async({_id}:{_id:string}) =>{
    return await get({api: `${api}/get/${_id}`})
  },
  list: async(params: LeadListParams = {}, signal?: AbortSignal) =>{
    return await get({api, options: {params, signal}})
  },
  upsert: async(lead: LeadInput) =>{
    return await post({api: `${api}/upsert`, options: {data: {...lead}}})
  },
}

