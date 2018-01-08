export abstract class Cache {

  abstract getItem<D>(key: string): Promise<D | undefined>

  abstract putItem (key: string, data: any): Promise<void>

  abstract invalidateItem (key: string): Promise<void>

}
