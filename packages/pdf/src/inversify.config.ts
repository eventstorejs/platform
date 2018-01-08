import { ContainerModule, interfaces } from 'inversify'
import { PdfService } from './services'

export const PdfModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<PdfService>(PdfService).to(PdfService).inSingletonScope()
})
