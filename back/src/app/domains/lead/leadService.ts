// @import_dependencies
import mongoose from 'mongoose'

// @import_services

// @import_models
import { Lead, Campaign, Third, Adnetwork, Tracking, Message, Interaction, Program } from "@app/models"
import { INCREMENTAL_RANGE } from "@app/models/leadModel"

// @import_utilities
import { responseUtility } from "@core/utilities/responseUtility"
import { paginationUtility } from "@core/utilities/paginationUtility"
import moment from "moment";

// @import_types

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MOBILE_PHONE_PATTERN = /^3\d{9}$/
const INCREMENTAL_ATTEMPTS = 5
const ACCENT_GROUPS = ['aá', 'eé', 'ií', 'oó', 'uúü', 'nñ']

class LeadService {
  
  
  constructor () {}
  
  public async upsert (_params) {
    try{ 
      if(_params._id && !mongoose.isObjectIdOrHexString(_params._id)) return responseUtility.error('lead.not_found')
      
      const first_name = this.cleanText(_params.first_name)
      const last_name = this.cleanText(_params.last_name)
      
      const lead_data = {
        first_name,
        last_name,
        full_name: `${first_name} ${last_name}`,
        email: this.cleanText(_params.email).toLowerCase(),
        mobile_phone: this.cleanText(_params.mobile_phone),
        interestProgram: _params.interestProgram
      }
      
      const fields = this.invalidFields(lead_data)
      if(fields.length) return responseUtility.error('lead.invalid_data', null, { fields })
      
      const program = await Program.findOne({_id: lead_data.interestProgram}).lean()
      if(!program) return responseUtility.error('program.not_found')
      
      const where:any = { email: lead_data.email }
      if(_params._id) where._id = { $ne: _params._id }
      const duplicated = await Lead.findOne(where).lean()
      if(duplicated) return responseUtility.error('lead.duplicated_email')
      
      if(_params._id){
        const exists = await Lead.findOne({_id: _params._id}).lean()
        if(!exists) return responseUtility.error('lead.not_found');
        
        const lead = await Lead.findOneAndUpdate({_id: _params._id}, {$set: lead_data}, {new:true, lean:true})
        
        
        return responseUtility.success({
          object: lead
        })
      } else {
        const lead = await this.createWithIncremental(lead_data)
        if(!lead) return responseUtility.error('lead.incremental_exhausted')
        
        
        return responseUtility.success({
          object: lead
        })
      }
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async adviserInfo (_params){
    try{
      const third = await Third.findOne({user: _params.user}).lean()
      if(!third) return responseUtility.error('third.not_found',null, {code: 404});
      
      const where_campaigns = {
        status: 'active',
      }
      let select_campaigns = 'name users.$'
      if(_params.campaign){
        where_campaigns['_id'] = _params.campaign
        select_campaigns = 'name users'
      } else {
        where_campaigns['users.third'] = third._id
      }
      
      const campaigns = await Campaign.find(where_campaigns)
      .select(select_campaigns)
      .sort({created_at:1})
      .lean()
      
      const _adnetworks = {}
      campaigns.forEach(_c=>{
        _c.users.forEach(_u=>{
          _u.adnetworks.forEach(_a=>{
            _adnetworks[_a] = _c._id
          })
        })
      })
      
      const [ adnetworks, leads, trackings] = await Promise.all([
        Adnetwork.find({
          status: 'active',
          _id: { $in: Object.keys(_adnetworks) }
        })
        .lean(),
        Lead.find({
          campaign: { $in: campaigns.map((_c:any)=>{return _c._id}) },
          status: {$in:['active', 'grading']},
          contact:  _params.contact
        })
        .lean(),
        Tracking.find({
          status: 'active'
        })
      ])
      
      return responseUtility.success({
        campaigns,
        leads, 
        adnetworks,
        parser: _adnetworks,
        trackings
      })
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async external (_params) {
    try{
      
      const create_interaction = {
        target: 'human',
        number: _params.number,
        last_inbound: moment().toISOString(),
        source: 'machine',
        type: 'form',
        status: 'ended',
        messages:[],
        _ref:{
          lead: null,
          adviser: null,
          contact: null
        }
      }
      
      let third
      if(_params.contact){
        third = await Third.findOne({_id: _params.contact}).lean()
      } else {
        third = await Third.findOne({number: _params.number,  type: 'cli'}).lean()
      }
      if(third){
        if(_params.content){
          const message_created = await Message.create({
            sender: third._id,
            inbound: true,
            content: _params.content,
            number: _params.number,
            type: 'form',
            source: 'web',
          })
          create_interaction.messages.push(message_created._id)
        }
        const lead = _params.not_found ?? await Lead.findOne({ contact: third._id, status: {$in:['active', 'grading']}}).lean()
        if(lead){
          const tracking = await Tracking.findOne({ 'defaults.again': true}).lean()
          await Lead.updateOne({_id: lead._id}, {
            $push: {
              trackings: {
                ...(lead.trackings?.[lead.trackings.length -1] || {}),
                tracking: tracking._id,
                interest: 4,
                created_at: moment().toISOString(),
              }
            }
          })
          
          create_interaction._ref.lead = lead._id
          create_interaction._ref.adviser = third._id
          create_interaction._ref.contact = lead.contact
          
          await Interaction.create(create_interaction)
          
          return responseUtility.success({
            object: lead
          })
        } else {
          const adnetwork = await Adnetwork.findOne({'defaults.organic': true}).lean()
          const campaign = await Campaign.findOne({status: 'active', 'users.adnetworks': adnetwork._id})
          .select('users.$')
          .lean()
          
          return await this.upsert({
            third: campaign.users[0].third, 
            contact: third._id, 
            adnetwork: adnetwork._id, 
            campaign: campaign._id
          })
        }
      } else {
        const create = await Third.create({
          email: _params.email,
          first_name: _params.first_name,
          last_name: _params.last_name,
          number: _params.number,
          status: 'active',
          location:{
            type: 'Point',
            coordinates: [0, 0]
          },
          type: 'cli',
        })
        const third = create.toObject()
        const adnetwork = await Adnetwork.findOne({'defaults.organic': true}).lean()
        const campaign = await Campaign.findOne({status: 'active', 'users.adnetworks': adnetwork._id})
        .select('users.$')
        .lean()

        //TODO: Balance
        if(_params.content){
          const message_created = await Message.create({
            sender: third._id,
            inbound: true,
            content: _params.content,
            number: _params.number,
            type: 'form',
            source: 'web',
          })
          create_interaction.messages.push(message_created._id)
        }
        
        const lead_created = await this.upsert({
          third: campaign.users[0].third, 
          contact: third._id, 
          adnetwork: adnetwork._id, 
          campaign: campaign._id
        })
        
        create_interaction._ref.lead = lead_created.object._id
        create_interaction._ref.adviser = third._id
        create_interaction._ref.contact = lead_created.object.contact
        if(!_params.ignore_interaction){
          await Interaction.create(create_interaction)
        }
        return lead_created
      }
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async list (_params) {
    try{
      const pagination = paginationUtility.parse(_params)
      if(pagination.fields.length) return responseUtility.error('pagination.invalid_params', null, { fields: pagination.fields })
      
      const where = this.searchFilter(_params.search)
      const [leads, total] = await Promise.all([
        Lead.find(where)
        .sort({created_at:-1, _id:-1})
        .skip(pagination.skip)
        .limit(pagination.pageSize)
        .populate({
          path: 'interestProgram',
          select: 'name',
          options: { lean:true }
        })
        .lean(),
        Lead.countDocuments(where)
      ])
      
      return responseUtility.success({
        list: leads,
        pagination: paginationUtility.meta(pagination.page, pagination.pageSize, total)
      })
    } catch (error) {
      console.log('error', error)
    }
  }
  
  public async test (_params) {
    try{
      
    } catch (error) {
      console.log('error', error)
    }
  }
  

  
  public async get (_params:{_id:string}) {
    try{
      const lead = await Lead.findOne({_id: _params._id})
      .populate({
        path: 'interestProgram',
        select: 'name',
        options: { lean:true }
      })
      .lean()
      
      if(!lead) return responseUtility.error('lead.not_found');
      const interactions = await Interaction.find({'_ref.lead': _params._id})
      .populate({
        path: 'messages',
        select: 'inbound from to content created_at',
        options: { lean:true }
      })
      .sort({created_at:-1})
      .lean()
      return responseUtility.success({
        lead,
        interactions
      })
      
    } catch (error) {
      console.log('error', error)
    }
  }
  
  private invalidFields (lead_data) {
    const fields: string[] = []
    if(!lead_data.first_name) fields.push('first_name')
    if(!lead_data.last_name) fields.push('last_name')
    if(!EMAIL_PATTERN.test(lead_data.email)) fields.push('email')
    if(!MOBILE_PHONE_PATTERN.test(lead_data.mobile_phone)) fields.push('mobile_phone')
    if(!mongoose.isObjectIdOrHexString(lead_data.interestProgram)) fields.push('interestProgram')
    return fields
  }
  
  private cleanText (value) {
    return typeof value === 'string' ? value.trim() : ''
  }
  
  private async createWithIncremental (lead_data, attempt = 1) {
    const incremental = await this.nextIncremental()
    if(incremental > INCREMENTAL_RANGE.max) return null
    
    try{
      const lead = await Lead.create({...lead_data, incremental})
      return lead.toObject()
    } catch (error) {
      const incremental_taken = error?.code === 11000 && error?.keyPattern?.incremental
      if(!incremental_taken || attempt >= INCREMENTAL_ATTEMPTS) throw error
      return this.createWithIncremental(lead_data, attempt + 1)
    }
  }
  
  private async nextIncremental () {
    const last = await Lead.findOneWithDeleted({})
    .sort({incremental:-1})
    .select('incremental')
    .lean()
    return last ? last.incremental + 1 : INCREMENTAL_RANGE.min
  }
  
  private searchFilter (search) {
    const term = this.cleanText(search)
    if(!term) return {}
    
    const pattern = this.searchPattern(term)
    const filters: any[] = [{full_name: pattern}, {email: pattern}, {mobile_phone: pattern}]
    if(/^\d+$/.test(term)) filters.push({incremental: Number(term)})
    return { $or: filters }
  }
  
  private searchPattern (term: string) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const accent_insensitive = ACCENT_GROUPS.reduce(
      (pattern, group) => pattern.replace(new RegExp(`[${group}]`, 'gi'), `[${group}]`),
      escaped
    )
    return new RegExp(accent_insensitive, 'i')
  }
}



export const leadService = new LeadService()
export { LeadService }