const mongoose = require('mongoose')

module.exports = mongoose.model('topic', {
    name: { type: String, unique: true, required: true },
    devices: [
      {
        id: 'string',
        nolost: 'boolean'
      }
    ]
})