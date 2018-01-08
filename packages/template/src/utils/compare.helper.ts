function checkCondition (v1: any, operator: string, v2: any) {
  switch (operator) {
    case '==':
      return (v1 === v2)
    case '===':
      return (v1 === v2)
    case '!==':
      return (v1 !== v2)
    case '<':
      return (v1 < v2)
    case '<=':
      return (v1 <= v2)
    case '>':
      return (v1 > v2)
    case '>=':
      return (v1 >= v2)
    case '&&':
      return (v1 && v2)
    case '||':
      return (v1 || v2)
    default:
      return false
  }
}

export function compare (this: any, v1: any, operator: string, v2: any, options: any) {
  return checkCondition(v1, operator, v2)
    ? options.fn(this)
    : options.inverse(this)
}
