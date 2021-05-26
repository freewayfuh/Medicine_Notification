const fs = require('fs')
const https = require('https')
const express = require('express')
const app = express()
const line = require('@line/bot-sdk')
const line_config = require('./config/line.js')
const db_config = require('./config/db.js')
const mysql = require('mysql')
const { formidable } = require('formidable')

const lineConfig = {
  channelAccessToken: line_config.accessToken,
  channelSecret: line_config.secret
}

const sslOptions = {
  key: fs.readFileSync(line_config.key_path),
  ca: fs.readFileSync(line_config.ca_path),
  cert: fs.readFileSync(line_config.cert_path)
}

//connect to mysql
const connection = mysql.createConnection(db_config.mysql)

connection.connect(err => {
  if (err) {
    console.log('fail to connect to mysql:', err)
    process.exit()
  }
})

app.use(express.static(`${__dirname}/dist`))
app.set('view engine', 'hbs')

//route
app.get('/add_medicine', (req, res) => {
  res.render('add_medicine')
})

app.get('/med_notify', (req, res) => {
  res.render('med_notify')
})

app.get('/contact', (req, res) => {
  res.render('contact')
})

app.get('/contact_invite', (req, res) => {
  res.render('contact_invite')
})

app.post('/webhook', line.middleware(lineConfig), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
})

//Pill Box
app.get('/load-pillBoxPage', (req, res) => {
  connection.query(`SELECT * FROM user_Med WHERE userId = '${req.query.userId}'`, (err, result) => {
    if (err) console.log('fail to SELECT', err)
    res.send(result)
  })
})

app.get('/add-med', (req, res) => {
  if (req.query.queryCond == 'insert') {
    connection.query(`INSERT INTO user_Med(medName, totalAmount, onceAmount, medPicture, userId) VALUES ('${req.query.medName}', ${req.query.totalAmount}, ${req.query.onceAmount}, '${req.query.medPicture}', '${req.query.userId}')`, (err, result) => {
      if (err) console.log('fail to INSERT:', err)
    })
  }
  else if (req.query.queryCond == 'update') {
    connection.query(`UPDATE user_Med SET medName = '${req.query.medName}', totalAmount=${req.query.totalAmount}, onceAmount=${req.query.onceAmount} WHERE user_MedId = ${req.query.user_MedId}`, (err, result) => {
      if (err) console.log('fail to UPDATE:', err)
    })
  }
  res.send('success')
})

app.get('/edit-med', (req, res) => {
  connection.query(`SELECT * FROM user_Med WHERE user_MedId = ${req.query.user_MedId}`, (err, result) => {
    if (err) console.log('fail to SELECT:', err)
    res.send(result)
  })
})

app.get('/delete-med', (req, res) => {
  connection.query(`DELETE FROM user_Med WHERE user_MedId = ${req.query.user_MedId}`,(err, result) => {
    if (err) console.log('fail to DELETE:', err)
    res.send('delete success')
  })  
})

//Notify
app.get('/get-notify', (req, res) => {
  connection.query(`SELECT * FROM user_Notify WHERE userId = '${req.query.userId}' ORDER BY notifyTime`, (err, result) => {
    if (err) console.log('fail to SELECT:', err)
    res.send(result)
  })
})

app.get('/get-med-notify', (req, res) => {
  connection.query(`SELECT * FROM Notify_Med, user_Med WHERE user_NotifyId = '${req.query.user_NotifyId}' AND Notify_Med.user_MedId = user_Med.user_MedId`, (err, result) => {
    if (err) console.log('fail to SELECT:', err)
    res.send(result)
  })
})

app.get('/pick-med', (req, res) => {
  connection.query(`SELECT * FROM user_Med WHERE userId = '${req.query.userId}'`, (err, result) => {
    if (err) console.log('fail to SELECT:', err)
    res.send(result)
  })
})

app.get('/create-med-notify', (req, res) => {
  if (req.query.queryCond == 'insert') {

    let user_NotifyId
    connection.query(`INSERT INTO user_Notify(notifyTime, userId) VALUES ('${req.query.hour}:${req.query.min}', '${req.query.userId}')`, (err, result) => {
      if (err) console.log('fail to INSERT:', err)
    })
    connection.query(`SELECT user_NotifyId FROM user_Notify WHERE notifyTime = '${req.query.hour}:${req.query.min}' AND userId = '${req.query.userId}'`, (err, result) => {
      if (err) console.log('fail to SELECT:', err)
      req.query.user_MedId.forEach(element => {
        connection.query(`INSERT INTO Notify_Med(user_NotifyId, user_MedId) VALUES (${result[0].user_NotifyId}, ${element})`, (err, result) => {
          if (err) console.log('fail to INSERT:', err)
        })
      })
    })
  }
  else if (req.query.queryCond.split('_')[0] == 'update') {
    connection.query(`UPDATE user_Notify SET notifyTime = '${req.query.hour}:${req.query.min}' WHERE user_NotifyId = ${req.query.queryCond.split('_')[1]}`, (err, result) => {
      if (err) console.log('fail to UPDATE:', err)
    })
    connection.query(`DELETE FROM Notify_Med WHERE user_NotifyId = ${req.query.queryCond.split('_')[1]}`, (err, result) => {
      if (err) console.log('fail to DELETE:', err)
    })
    req.query.user_MedId.forEach(element => {
      connection.query(`INSERT INTO Notify_Med(user_NotifyId, user_MedId) VALUES (${req.query.queryCond.split('_')[1]}, ${element})`, (err, result) => {
        if (err) console.log('fail to INSERT:', err)
      })    
    })
  }
  res.send('success')
})

app.get('/edit-notify', (req, res) => {
  console.log(`editing user_NotifyId:${req.query.user_NotifyId}`)
  connection.query(`SELECT user_MedId FROM Notify_Med WHERE user_NotifyId = ${req.query.user_NotifyId}`, (err, result) => {
    if (err) console.log('fail to SELECT:', err)
    res.send(result)
  }) 
})

app.get('/delete-notify', (req, res) => {
  connection.query(`DELETE FROM user_Notify WHERE user_NotifyId = ${req.query.user_NotifyId}`, (err, result) => {
    if (err) console.log('fail to DELETE:', err)
    res.send('delete success')
  })
})



//Contact
app.get('/check-isFriend', (req, res) => {
  connection.query(`SELECT * FROM user_Info WHERE userId='${req.query.userId}'`,(err, result) => {
    if(err) console.log('fail to select:', err)
    if(result.length > 0){
      res.send(true)
    }else{
      res.send(false)
    }
  })    
})

app.get('/switch-notify', (req, res) =>{
  console.log(req.query.user_NotifyId)
  res.send('switch success!!')
})


//Contact
app.get('/check-isFriend', (req, res) => {
  connection.query(`SELECT * FROM user_Info WHERE userId='${req.query.userId}'`,(err, result) => {
    if(err) console.log('fail to select:', err)
    if(result.length > 0){
      res.send(true)
    }else{
      res.send(false)
    }
  })    
})


app.get('/create-inviteCode', (req, res) =>{
  res.send('2516')
})

app.get('/create-inviteCode', (req, res) =>{
  res.send('2516')
})

const client = new line.Client(lineConfig)

//////////////////////////////////////////////////

var check_message = {
  "type": "template",
  "altText": "this is a carousel template",
  "template": {
    "type": "carousel",
    "columns": [
      {
        "title": "您服用藥物了嗎？",
        "text": "若服用完藥物，點選「吃了」，若還沒服用，我們將10分鐘後提醒您。",
        "actions": [
          {
            "type": "message",
            "label": "吃了",
            "text": "吃了"
          }
        ]
      }
    ]
  }
}

//////////////////////////////////////////////////

function run() {
  var now = new Date()

  if (now.getSeconds() == 0) {
    connection.query(`INSERT INTO user_Notify_temp SELECT * FROM user_Notify WHERE notifyTime = '${now.getHours()}:${now.getMinutes()}:00'`, (err, result) => {
      if (err) console.log('fail to INSERT:', err)
    })
  }
  connection.query(`SELECT * FROM user_Notify WHERE notifyTime = '${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}'
                    UNION SELECT * FROM user_Notify_temp WHERE notifyTime = '${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}'`, (err, result) => {
    if (err) console.log('fail to SELECT:', err)
    if (result.length == 0) return;
    console.log(result)

    var now = new Date()
    for (var i = 0; i < result.length; i++) {
      var drug = {
        type : 'text',
        text : `現在時間是${now.getHours()}:${now.getMinutes()}，記得藥服用以下藥物：`
      }

      var carousel_msg = {
        "type": "template",
        "altText": "this is an image carousel template",
        "template": {
          "type": "image_carousel",
          "columns": [
          ]
        }
      }

      var test = {
        "type": "template",
        "altText": "This is a buttons template",
        "template": {
            "type": "buttons",
            "title": "您服用藥物了嗎？",
            "text": "若服用完藥物，點選「吃了」，若還沒服用，我們將10分鐘後提醒您。",
            "actions": [
                {
                  "type": "postback",
                  "label": "吃了",
                  "text": "吃了",
                  "data": `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
                }
            ]
        }
      }

      connection.query(`UPDATE user_Notify_temp SET notifyTime = DATE_ADD(notifyTime, INTERVAL 10 MINUTE) WHERE user_NotifyId = ${result[i]['user_NotifyId']}`, (err, result) => {
        if (err) console.log('fail to UPDATE:', err)
      })
      
      connection.query(`SELECT * FROM user_Med, Notify_Med WHERE user_Med.user_MedId = Notify_Med.user_MedId AND Notify_Med.user_NotifyId = ${result[i]['user_NotifyId']}`, (err, result) => {
        if (err) console.log('fail to UPDATE:', err)
        result.forEach(element => {
          carousel_msg.template.columns.push({
            "imageUrl": element.medPicture,
            "action": {
              "type": "message",
              "label": `${element.medName}，${element.onceAmount}顆`,
              "text": `${element.medName}，${element.onceAmount}顆`
            }
          })  
        })
      })

      var r = result[i]['userId']

      // client.pushMessage(r, drug)
      // setTimeout(function(){client.pushMessage(r, carousel_msg);}, 1000)
      // setTimeout(function(){client.pushMessage(r, test);}, 2000)

      client.pushMessage(r, drug)
      client.pushMessage(r, carousel_msg)
      client.pushMessage(r, check_message)
    }
  })
}
setInterval(run, 1000)

function handleEvent(event) {
  console.log(event)
  if (event.type == 'follow') {
    client.getProfile(event.source.userId).then((profile) => {
      connection.query(`INSERT INTO user_Info(userId, userName, picture) VALUES ('${profile.userId}', '${profile.displayName}', '${profile.pictureUrl}')`, (err, result) => {
        if (err) console.log('fail to INSERT:', err)
      })
    })

    let greeting = {
      "type": "template",
      "altText": "this is a buttons template",
      "template": {
        "type": "buttons",
        "thumbnailImageUrl": "https://luffy.ee.ncku.edu.tw:1516/img/drugbox_template.jpg",
        "imageAspectRatio": "rectangle",
        "imageSize": "cover",
        "title": "建立我的藥盒",
        "text": "請您先提供目前服用的藥物有哪些吧！",
        "actions": [
          {
            "type": "uri",
            "label": "新增藥物",
            "uri" : "https://liff.line.me/1655992059-rQ4pnw5w"
          }
        ]
      }
    }

    client.replyMessage(event.replyToken, greeting)
  }

  if (event.type == 'unfollow') {
    connection.query(`DELETE FROM user_Info WHERE userId = '${event.source.userId}'`, (err, result) => {
      if (err) console.log('fail to DELETE:', err)
    })
  }

  // if (event.type == 'message') {
  //   if (event.message.text == '吃了') {
  //     var now = new Date()
  //     connection.query(`DELETE FROM user_Notify_temp WHERE notifyTime >= '${now.getHours()}:${now.getMinutes()}:00' AND userId = '${event.source.userId}'`, (err, result) => {
  //       if (err) console.log('fail to DELETE:', err)
  //     })
  //   }
  // }

  if (event.type == 'postback') {
    // console.log(event.postback.data)
    connection.query(`DELETE FROM user_Notify_temp WHERE notifyTime >= '${event.postback.data}' AND userId = '${event.source.userId}'`, (err, result) => {
      if (err) console.log('fail to DELETE:', err)
    })

    const message = {
      type: 'text',
      text: '收到'
    };

    client.replyMessage(event.replyToken, message)
  }
}

const server = https.createServer(sslOptions, app)

server.listen(line_config.port, () => {
	console.log(`listen on port ${line_config.port}`)
})