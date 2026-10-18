// @import_dependencies

// @import_services

// @import_models
import { Program } from "@app/models"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"

// @import_types


class ProgramService {
  
  
  constructor () {}
  
  
  
  public async list (_params) {
    try{
      const programs = await Program.find({})
      .select('name description')
      .sort({name:1})
      .lean()

      return responseUtility.success({
        list: programs
      })
    } catch (error) {
      console.log('error', error)
    }
  }
}

export const programService = new ProgramService()
export { ProgramService }