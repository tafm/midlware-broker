module.exports = {
  toObj (string) {
    return JSON.parse(string)
  },

  toString(obj) {
    return JSON.stringify(obj)
  }
}