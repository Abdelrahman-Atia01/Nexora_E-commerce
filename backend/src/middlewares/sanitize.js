// Strips Mongo operators ("$gt") and dotted keys from body & params (NoSQL injection).
// Query strings are handled by ApiFeatures (operator whitelist).
const clean = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) delete obj[key]
    else clean(obj[key])
  }
  return obj
}

export const sanitize = (req, res, next) => {
  clean(req.body)
  clean(req.params)
  next()
}
