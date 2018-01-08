import {Context} from '@eventstorejs/request'

export interface CqrsContext extends Context {
  isReplay: boolean
}
