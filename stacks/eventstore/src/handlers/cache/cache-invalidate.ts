import { inject } from 'inversify'
import { eventHandler, EventStoreModule, EventHandler, Event } from '@eventstorejs/eventstore'
// import { Context } from '@eventstorejs/request'
import { CacheModule, Cache } from '@eventstorejs/cache'

// @eventHandler({
//   name: 'cache-invalidate',
//   imports: [
//     EventStoreModule,
//     // CacheModule
//   ]
// })
export default class CacheInvalidateHandler implements EventHandler {

  constructor (@inject(Cache) private cache: Cache) {
  }

  async handleAll (event: Event) {
    await this.cache.invalidateItem(event.aggregateId as string)
  }
}
