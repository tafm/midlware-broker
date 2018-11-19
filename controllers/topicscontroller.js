const Topic = require('../models/topic')
const Device = require('../models/device')
const marshaler = require('../marshaler')

function createTopic(topic) {
  return new Promise((accept, reject) => {
    topic.save((err, topic) => {
      if (topic) {
        accept()
      } else {
        reject()
      }
    })
  })
}

module.exports = {
  sub (nametopic, id, nolost) { // no lost garante que todas as mensagens serão entregues ao dispositivo
    return new Promise((accept, reject) => {
      Topic.findOne({ 'name': nametopic }, function (err, topic) {
        if (topic) {
          if (!topic.devices.some(d => d.id == id)) { // checa se o dispositivo já não estava subscrito no tópico
            topic.devices.push({
              'id': id,
              'nolost': nolost
            })
            topic.save((err, t) => {
              if (t) {
                accept()
              } else {
                reject()
              }
            })
          } else { // se dispositivo já estava subscrito ignora
            reject()
          }
        } else {
          createTopic(new Topic({
            'name': nametopic,
            'devices': [{
              'id': id,
              'nolost': nolost
            }]
         })).then(() => {
          accept()
         }).catch(() => {
          reject()
         })
        }
      })
    })
  },

  unsub (nametopic, id) { // remover subscrição a determinado tópico
    return new Promise((accept, reject) => {
      Topic.findOne({ 'name': nametopic }, function (err, topic) {
        if (topic) {
          if (topic.devices.some(d => d.id == id)) { // checa se o dispositivo já não estava subscrito no tópico
            topic.devices = topic.devices.filter(d => d.id !== id)
            topic.save((err, t) => {
              if (t) {
                accept()
              } else {
                reject()
              }
            })
          } else {
            reject()
          }
        } else {
          reject()
        }
      })
    })
  },

  pub (nametopic, id, message, connections) { // recebe as conexões atuais para decidir se envia ou armazena no banco
    return new Promise((accept, reject) => {
      Topic.findOne({ 'name': nametopic }, function (err, topic) {
        if (topic) {
          topic.devices.forEach(d => {
            let con = connections.filter(c => c.id == d.id) // se tem uma conexão ativa para o dispositivo manda diretamente
            if (con.length != 0) {
              con = con[0]
              con.con.sendUTF(marshaler.toString({
                'type': 'msg',
                'topic': nametopic,
                'message': message
              }))
            } else {
              Device.findOne({ 'id': d.id }, function(err, device) { // se não tem armazena no banco pra enviar após a conexão no futuro
                if (device) {
                  if (d.nolost || device.messages.length == 0) { // se deve armazenar o histórico completo ou não tem nenhuma mensagem
                    device.messages.push({
                      'topic': nametopic,
                      'text': message,
                      'publisherid': id
                    })
                  } else {
                    device.messages[device.messages.length - 1] = {
                      'topic': nametopic,
                      'text': message,
                      'publisherid': id
                    }
                  }
                  device.save((err, ds) => {})
                } else {
                  let nd = new Device({
                    'id': d.id,
                    'messages': {
                      'topic': nametopic,
                      'text': message,
                      'publisherid': id
                    }
                  })
                  nd.save((err, nds) => {})
                }
              })
            }
          })
        } else {
          createTopic(new Topic({
            'name': nametopic,
            'devices': []
         }))
        }
        accept()
      })
    })
  },

  checkOldMessages(id, con) {
    return new Promise((accept, reject) => {
      Device.findOne({ 'id': id }, function(err, device) {
        if (device) {
          device.messages.forEach(m => {
            con.sendUTF(marshaler.toString(m))
          })
          device.messages = []
          device.save((err, dev) => {})
        }
        accept()
      })
    })
  }
}