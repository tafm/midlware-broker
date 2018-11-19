const mongoose = require('mongoose')
const topicscontroller = require('./controllers/topicscontroller')
const WebSocketServer = require('websocket').server
const http = require('http')
const marshaler = require('./marshaler')
const Topic = require('./models/topic')

// conexão com banco de dados --------------------------------------------------

mongoose.connect("mongodb://mongo:27017/mom").then(() => {
  console.log('. using db')
}).catch(e => {
  console.log('. running without db')
})
mongoose.Promise = global.Promise

// iniciação do websocket server -----------------------------------------------

var server = http.createServer(function(request, response) {

})

server.listen(8082, function() { });

wsServer = new WebSocketServer({
  httpServer: server
})

let connections = [] // formato {con, id}

wsServer.on('request', function(request) {
  let connection = request.accept('broker', request.origin)
  let id = null

  connection.on('message', async function(message) {
    if (message.type === 'utf8') {
      try {
        let obj = marshaler.toObj(message.utf8Data)
      switch(obj.type) {
        case 'ident':
          id = obj.id
          connections.push({
            'con': connection,
            'id': id
          })
          // checa se tem mensagens guardadas para envio
          topicscontroller.checkOldMessages(id, connection)
          break
        case 'pub':
          if (id) {
            await topicscontroller.pub(obj.topic, id, obj.message, connections)
          }
          break
        case 'sub':
          if (id) {
            await topicscontroller.sub(obj.topic, id, obj.nolost)
          }
          break
        case 'unsub':
          if (id) {
            await topicscontroller.unsub(obj.topic, id)
          }
          break
        }
      } catch(e) {
        console.log('erro com solicitação')
      }
    }
  })

  connection.on('close', function(connection) {
    if (id) {
      connections = connections.filter(c => c.id != id)
      console.log('device id "' + id + '" disconnected')
    }
  })
})

//-------------

// topicscontroller.sub('mesas', '1234', true).then(() => {
//   console.log('subscrição ok')
// }).catch(() => {
//   console.log('subscrição fail')
// })

// topicscontroller.unsub('mesas', '1234').then(() => {
//   console.log('dessubscrição ok')
// }).catch(() => {
//   console.log('dessubscrição fail')
// })

// topicscontroller.pub('mesas', '123', 'bom dia', connections).then(() => {
//   console.log('ok')
// }).catch(() => {
//   console.log('erro no pub')
// })