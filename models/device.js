const mongoose = require('mongoose')

module.exports = mongoose.model('device', {
    id: { type: String, unique: true, required: true },
    messages: [
      {
        topic: 'string',
        text: 'string',
        publisherid: 'string'
      }
    ]
})