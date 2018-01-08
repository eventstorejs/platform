import { ContainerModule, interfaces } from 'inversify'

export interface ImportModule extends Function {
  (module: ContainerModule): void
}

export interface ImportModuleCallBack extends Function {
  (required: ImportModule): void
}

export class RegistryContainerModule extends ContainerModule {

  public required: Array<ContainerModule> = []

  constructor (registry: interfaces.ContainerModuleCallBack, imports?: ImportModuleCallBack) {
    super(registry)
    if (imports) {
      imports((m) => this.importModule(m))
    }
  }

  importModule (m: ContainerModule) {
    this.required.push(m)
  }

}

export function isRegistryContainerModule (m: RegistryContainerModule | ContainerModule): m is RegistryContainerModule {
  /*tslint:disable */
  return m && (m as RegistryContainerModule).required !== undefined
  /*tslint:enable */
}
