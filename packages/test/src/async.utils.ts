export function wait<T> (millis = 1000, val?: T): Promise<T> {
  return new Promise<T>((resolve) => setTimeout(() => resolve(val), millis))
}
