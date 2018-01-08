import * as t from 'io-ts'

export const DateType: t.Type<Date> = {
  _A: t._A,
  name: 'Date',
  validate: (v, c) => (v instanceof Date ? t.success(v) : t.failure<Date>(v, c))
}

export function optional<R extends t.Props, O extends t.Props> (
  required: R,
  optional: O,
  name?: string
): t.IntersectionType<[t.InterfaceType<R>, t.PartialType<O>], t.InterfaceOf<R> & t.PartialOf<O>> {
  return t.intersection([t.interface(required), t.partial(optional)], name)
}

export function enumType<E extends string | number | boolean> (enumType: { [key: string]: string }): t.UnionType<[t.LiteralType<E>]> {
  return t.union(Object.keys(enumType).map(k => t.literal(k)) as any)
}

export function maybe<RT extends t.Any> (
  type: RT,
  name?: string
): t.UnionType<[RT, typeof t.undefined], t.TypeOf<RT> | undefined> {
  return t.union([type, t.undefined], name)
}

export function updatable<RT extends t.Any> (
  type: RT,
  name?: string
): t.UnionType<[RT, typeof t.undefined, typeof t.null], t.TypeOf<RT> | null | undefined> {
  return t.union([type, t.undefined, t.null], name)
}
