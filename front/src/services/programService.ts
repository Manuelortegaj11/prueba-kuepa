import { get } from "../util/http"
const api = '/program'
export const programService = {
  api,
  list: async() =>{
    return await get({api})
  },
}
