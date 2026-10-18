import { get, post } from "../util/http"
const api = '/lead'

export interface LeadInput {
  first_name: string
  last_name: string
  email: string
  mobile_phone: string
  interestProgram: string
}

export const leadService = {
  api,
  get: async({_id}:{_id:string}) =>{
    return await get({api: `${api}/get/${_id}`})
  },
  list: async() =>{
    return await get({api})
  },
  upsert: async(lead: LeadInput) =>{
    return await post({api: `${api}/upsert`, options: {data: {...lead}}})
  },
}

