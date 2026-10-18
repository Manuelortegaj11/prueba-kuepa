// @import_dependencies
import { Application } from 'express'

// @import_routes
import { LeadRoute } from '@app/domains/lead/leadRoute'
import { ProgramRoute } from '@app/domains/program/programRoute'
import { RoleRoute } from '@app/domains/role/roleRoute'
import { PermissionRoute } from '@app/domains/permission/permissionRoute'
import { GlobalRoute } from '@app/domains/global/globalRoute'
import { UserRoute } from '@app/domains/user/userRoute'
import { AuthRoute } from '@app/domains/auth/authRoute'
import { ThirdRoute } from '@app/domains/third/thirdRoute'

class Routes {
  
  private app: Application
  private prefix: string = '/api'
  
  // @declare_routes
  private leadRoute: LeadRoute
  private programRoute: ProgramRoute
  
  private roleRoute: RoleRoute
  private permissionRoute: PermissionRoute
  private thirdRoute: ThirdRoute
  private globalRoute: GlobalRoute
  private authRoute: AuthRoute
  private userRoute: UserRoute

  constructor(app: Application) {
    this.app = app
    // @assign_routes
    this.leadRoute = new LeadRoute(this.app, this.prefix)
    this.programRoute = new ProgramRoute(this.app, this.prefix)
    this.roleRoute = new RoleRoute(this.app, this.prefix)
    this.permissionRoute = new PermissionRoute(this.app, this.prefix)
    this.thirdRoute = new ThirdRoute(this.app, this.prefix)
    this.globalRoute = new GlobalRoute(this.app, this.prefix)
    this.userRoute = new UserRoute(this.app, this.prefix)
    this.authRoute = new AuthRoute(this.app, this.prefix)

  }

  public init() {
    try{
      // @init_routes
      this.leadRoute.init()
      this.programRoute.init()
      this.roleRoute.init()
      this.permissionRoute.init()
      this.thirdRoute.init()
      this.globalRoute.init()
      this.userRoute.init()
      this.authRoute.init()

    } catch (error) {
      console.log('error', error)
    }
  }

}

export { Routes }