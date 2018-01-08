// import { Provider, NgModule, Optional, SkipSelf, ModuleWithProviders } from '@angular/core'
// import { Config, APP_CONFIG, ConfigMap } from './services/config'

// export function configFactory (config: ConfigMap) {
//   return new Config(config)
// }

// @NgModule({
//   imports: [
//   ],
//   declarations: [
//   ],
//   exports: [
//   ],
//   providers: [
//     ...CoreModule.PROVIDERS
//   ]
// })
// export class CoreModule {

//   static PROVIDERS: Array<Provider> = [
//     { provide: Config, useFactory: configFactory, deps: [APP_CONFIG] }
//   ]

//   constructor( @Optional() @SkipSelf() parentModule: CoreModule) {
//     if (parentModule) {
//       throw new Error('CoreModule already loaded; Import in root module only.')
//     }
//   }
//   // configuredProviders: *required to configure WindowService and ConsoleService per platform
//   static forRoot (configuredProviders: Array<any>): ModuleWithProviders {
//     return {
//       ngModule: CoreModule,
//       providers: configuredProviders
//     }
//   }

// }
