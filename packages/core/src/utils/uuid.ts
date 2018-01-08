// generate mongodb like objectId: http://stackoverflow.com/questions/10593337/is-there-any-way-to-create-mongodb-like-id-strings-without-mongodb

const empty: any = ' '
const ObjectId = (m = Math, d = Date, h = 16, s = (s: any) => m.floor(s).toString(h)) =>
s(d.now() / 1000) + empty.repeat(h).replace(/./g, () => s(m.random() * h))

export function generateUUID () {
  return ObjectId()
}
