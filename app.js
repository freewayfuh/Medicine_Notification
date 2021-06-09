const fs = require('fs')
const https = require('https')
const express = require('express')
const app = express()
const line = require('@line/bot-sdk')
const line_config = require('./config/line.js')
const mysql = require('mysql')
const db_config = require('./config/db.js')
const { formidable } = require('formidable')
const bodyParser = require('body-parser')


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
    console.log('fail to connect:', err)
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
  console.log(req.query.userId)
  let data = {}
  connection.query(`SELECT * FROM Supervise, user_Info WHERE supervisorId='${req.query.userId}' AND superviseeId=userId`,(err, result) => {
    if(err) console.log('fail to select:', err)
    data.supervise = result
  })

  connection.query(`SELECT * FROM user_Med WHERE userId='${req.query.userId}'`,(err, result) => {
    if(err) console.log('fail to select:', err)
    data.user_Med = result
    res.send(data)
  })

})


app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))
app.use(bodyParser.json({limit: '50mb', extended: true}))

app.post('/add-med', (req, res) => {
  if(req.body.queryCond == 'insert'){
    connection.query(`SELECT MAX(user_MedId) FROM user_Med`, (err, result) =>{
      if(err) console.log('fail to select:', err)
      connection.query(`ALTER table user_Med AUTO_INCREMENT=${result[0]['MAX(user_MedId)']}`,(err, result) => {
        if(err) console.log('fail to alter table:', err)
      })    
      let picName = `${result[0]['MAX(user_MedId)']+1}.png`
      fs.writeFile(`./dist/img/medPic/${picName}`, req.body.medPicture.split('base64,')[1], 'base64', function(err) {
        console.log(err)
      })
      connection.query(`INSERT INTO user_Med(medName, totalAmount, onceAmount, medPicture, userId) VALUES ('${req.body.medName}', ${req.body.totalAmount}, ${req.body.onceAmount}, 'img/medPic/${picName}', '${req.body.userId}')`,(err, result) => {
        if(err) console.log('fail to insert:', err)
        res.send('insert success')
      })
         
    })
  }else if(req.body.queryCond == 'update'){
    connection.query(`UPDATE user_Med SET medName='${req.body.medName}', totalAmount=${req.body.totalAmount}, onceAmount=${req.body.onceAmount} WHERE user_MedId=${req.body.user_MedId}`,(err, result) => {
      if(err) console.log('fail to update:', err)
      if(req.body.medPicture != 'unchange'){
        fs.writeFile(`./dist/img/medPic/${req.body.user_MedId}.png`, req.body.medPicture.split('base64,')[1], 'base64', function(err) {
          console.log(err)
          res.send('update success')
        })
      }else{
        res.send()
      }
    })     
  }
})


app.get('/edit-med', (req, res) => {
  console.log(req.query.user_MedId)
  connection.query(`SELECT * FROM user_Med WHERE user_MedId=${req.query.user_MedId}`,(err, result) => {
    if(err) console.log('fail to select:', err)
    res.send(result)
  })  
})


app.get('/delete-med', (req, res) => { 
  connection.query(`DELETE FROM user_Med WHERE user_MedId=${req.query.user_MedId}`,(err, result) => {
    if(err) console.log('fail to delete:', err)
    fs.unlink(`./dist/img/medPic/${req.query.user_MedId}.png`, (err) => {
      if(err) throw err
    })
    connection.query(`DELETE FROM user_Notify WHERE user_NotifyId NOT IN(SELECT DISTINCT user_NotifyId FROM Notify_Med)`,(err, result) => {
      if(err) console.log('fail to delete:', err)
    })    
    res.send('delete success')
  })
})


//Notify
app.get('/get-notify', (req, res) => {
  let data = {}
  connection.query(`SELECT * FROM Supervise, user_Info WHERE supervisorId='${req.query.userId}' AND superviseeId=userId`,(err, result) => {
    if(err) console.log('fail to select:', err)
    data.supervise = result
  })

  connection.query(`SELECT * FROM user_Notify WHERE userId='${req.query.userId}' ORDER BY notifyTime`,(err, result) => {
    if(err) console.log('fail to select:', err)
    data.user_Notify = result
    res.send(data)
  })

})

app.get('/get-med-notify', (req, res) => {
  connection.query(`SELECT * FROM Notify_Med, user_Med WHERE user_NotifyId='${req.query.user_NotifyId}' AND Notify_Med.user_MedId = user_Med.user_MedId`,(err, result) => {
    if(err) console.log('fail to select:', err)
    //console.log(result)
    res.send(result)
  })
})

app.get('/pick-med', (req, res) => {
  console.log(`${req.query.userId}`)
  connection.query(`SELECT * FROM user_Med WHERE userId='${req.query.userId}'`,(err, result) => {
    if(err) console.log('fail to select:', err)
    res.send(result)
  })
})

app.get('/create-med-notify', (req, res) => {
  console.log(req.query.user_MedId)

  if(req.query.queryCond == 'insert'){
    console.log('insert')

    connection.query(`INSERT INTO user_Notify(notifyTime, userId, switch) VALUES ('${req.query.hour}:${req.query.min}','${req.query.userId}', 'checked')`,(err, result) => {
      if(err) console.log('fail to insert test:', err)
    })
    connection.query(`SELECT MAX(user_NotifyId) FROM user_Notify`,(err, result) => {
      if(err) console.log('fail to select:', err)
      req.query.user_MedId.forEach(element => {
        connection.query(`INSERT INTO Notify_Med(user_NotifyId, user_MedId) VALUES (${result[0]['MAX(user_NotifyId)']}, ${element})`,(err, result) => {
          if(err) console.log('fail to insert:', err)
        })    
      })
    })
  }else if(req.query.queryCond.split('_')[0] == 'update'){
    console.log('update')
    console.log(req.query.queryCond.split('_')[1])
    connection.query(`UPDATE user_Notify SET notifyTime='${req.query.hour}:${req.query.min}' WHERE user_NotifyId=${req.query.queryCond.split('_')[1]}`,(err, result) => {
      if(err) console.log('fail to update:', err)
    })
    connection.query(`DELETE FROM Notify_Med WHERE user_NotifyId=${req.query.queryCond.split('_')[1]}`,(err, result) => {
      if(err) console.log('fail to delete:', err)
    })

    req.query.user_MedId.forEach(element => {
      connection.query(`INSERT INTO Notify_Med(user_NotifyId, user_MedId) VALUES (${req.query.queryCond.split('_')[1]}, ${element})`,(err, result) => {
        if(err) console.log('fail to insert:', err)
      })    
    })
  }
  
  res.send('success')
  
})

app.get('/edit-notify', (req, res) => {
  console.log(`editing:${req.query.user_NotifyId}`)
  connection.query(`SELECT user_MedId FROM Notify_Med WHERE user_NotifyId=${req.query.user_NotifyId}`,(err, result) => {
    if(err) console.log('fail to select:', err)
    //console.log(result)
    res.send(result)
  }) 
})

app.get('/delete-notify', (req, res) => { 
  connection.query(`DELETE FROM user_Notify WHERE user_NotifyId=${req.query.user_NotifyId}`,(err, result) => {
    if(err) console.log('fail to delete:', err)
    res.send('delete success')
  })

})

app.get('/switch-notify', (req, res) =>{
  if(req.query.switch_status != 'ckecked'){
    connection.query(`DELETE FROM user_Notify_temp WHERE user_NotifyId=${req.query.user_NotifyId}`,(err, result) => {
      if(err) console.log('fail to delete:', err)
    })    
  }
  connection.query(`UPDATE user_Notify SET switch='${req.query.switch_status}' WHERE user_NotifyId=${req.query.user_NotifyId}`, (err, result) => {
    if(err) console.log('fail to update:', err)
    res.send('switch success!!')
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


app.get('/create-inviteCode', (req, res) =>{
  res.send('2516')
})

const client = new line.Client(lineConfig)

function run() {
  var now = new Date()

  if (now.getSeconds() == 0) {  // 這樣就只會執行一次
    connection.query(`INSERT INTO user_Notify_temp SELECT * FROM user_Notify WHERE switch = 'checked' AND notifyTime = '${now.getHours()}:${now.getMinutes()}:00'`, (err, result) => {
      if (err) console.log('fail to INSERT:', err)
    })
  }

  // connection.query(`SELECT * FROM user_Notify WHERE switch = 'checked'`, (err, result) => {
  //   if (err) console.log('fail to SELECT:', err)
  //   console.log(result)
  // })

  connection.query(`SELECT user_NotifyId, notifyTime, userId FROM user_Notify WHERE switch = 'checked' AND notifyTime = '${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}'
                    UNION SELECT user_NotifyId, notifyTime, userId FROM user_Notify_temp WHERE notifyTime = '${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}'`, (err, result) => {
    if (err) console.log('fail to SELECT:', err)
    if (result.length == 0) return;
    console.log(result)
    console.log()

    var now = new Date()
    for (var i = 0; i < result.length; i++) {
      // 次數+1
      connection.query(`UPDATE user_Notify_temp SET time = time + 1 WHERE userId = '${result[i]['userId']}'`, (err, result) => {
        if (err) console.log('fail to UPDATE:', err)
      })

      // 提醒三次就停止提醒
      connection.query(`DELETE FROM user_Notify_temp WHERE userId = '${result[i]['userId']}' AND time = 3`, (err, result) => {
        if (err) console.log('fail to DELETE:', err)
      })

      var drug = {
        type : 'text',
        text : `現在時間是${now.getHours()}:${now.getMinutes()}，記得藥服用以下藥物：`
      }

      var carousel_msg = {
        type : "template",
        altText : "this is an image carousel template",
        template : {
          type : "image_carousel",
          columns : []
        }
      }

      var check_message = {
        type : "template",
        altText : "This is a buttons template",
        template : {
            type : "buttons",
            title : "您服用藥物了嗎？",
            text : "若服用完藥物，點選「吃了」，若還沒服用，我們將10分鐘後提醒您。",
            actions : [
                {
                  type : "postback",
                  label : "吃了",
                  text : "吃了",
                  data : `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
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

      const message = []
      message.push(drug)
      message.push(carousel_msg)    // console.log 顯示出來的時候 columns 是空的，但是最後送出來又有 真神奇！
      message.push(check_message)
      console.log(message)

      var r = result[i]['userId']   // 不知為啥一定要獨立出來寫才不會 TypeError: Cannot read property 'userId' of undefined (好像有query 就會有延遲和同步問題)

      // 因為非同步問題，所以要讓 replyMessage 延後一秒再執行，才會有所有訊息
      setTimeout(function(){client.pushMessage(r, message);}, 1000)

      // var r = result[i]['userId']
      // client.pushMessage(r, drug)
      // setTimeout(function(){client.pushMessage(r, carousel_msg);}, 1000)
      // setTimeout(function(){client.pushMessage(r, check_message);}, 2000)

      // client.pushMessage(r, drug)
      // client.pushMessage(r, carousel_msg)
      // client.pushMessage(r, check_message)
    }
  })
}

setInterval(run, 1000)

function handleEvent(event) {

  if(event.type == 'follow'){
    client.getProfile(event.source.userId).then((profile) => {
      
      connection.query(`INSERT INTO user_Info(userId, userName, picture) VALUES ('${profile.userId}','${profile.displayName}','${profile.pictureUrl}')`, (err, result) => {
        if(err) console.log('fail to insert:', err)
      })
      
    })
    .catch((err) => {
      console.log('err')
    })
    
    let greeting = {
      "type": "template",
      "altText": "this is a buttons template",
      "template": {
        "type": "buttons",
        "thumbnailImageUrl": "https://luffy.ee.ncku.edu.tw:7128/img/drugbox_template.jpg",
        "imageAspectRatio": "rectangle",
        "imageSize": "cover",
        "title": "建立我的藥盒",
        "text": "請您先提供目前服用的藥物有哪些吧！",
        "actions": [
          {
            "type": "uri",
            "label": "新增藥物",
            "uri" : "https://liff.line.me/1655949102-WX1rbAJw"
          },
          {
            "type":"uri",
            "label":"新增提醒",
            "uri":"https://liff.line.me/1655949102-QOy7mkzW"
          }
        ]
      }
    }

    client.replyMessage(event.replyToken, greeting)    
  }

  if(event.type == 'unfollow'){
    connection.query(`DELETE FROM user_Info WHERE userId='${event.source.userId}'`, (err, result) => {
      if(err) console.log('fail to delete:', err)
    })
  }

  if (event.type == 'message') {
    if (event.message.text == '吃了') {
      console.log('吃藥了')
      var now = new Date()
      connection.query(`DELETE FROM user_Notify_temp WHERE notifyTime >= '${now.getHours()}:${now.getMinutes()}:00'
                        AND userId = '${event.source.userId}'`, (err, result) => {
        if(err) console.log('fail to delete:', err)
      })
    }

  }


  console.log(event)
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  if (event.message.id == '100001') return 200 // to deal with verify dummy data

  if (event.type == 'postback') {
    const message = [{
      type: 'text',
      text: '收到'
    }];

    connection.query(`DELETE FROM user_Notify_temp WHERE notifyTime >= '${event.postback.data}' AND userId = '${event.source.userId}'`, (err, result) => {
      if (err) console.log('fail to DELETE:', err)
    })
    
    connection.query(`UPDATE user_Med SET totalAmount = totalAmount - onceAmount WHERE userId = '${event.source.userId}' AND totalAmount >= onceAmount`, (err, result) => {
      if (err) console.log('fail to UPDATE:', err)
    })

    connection.query(`SELECT medName, totalAmount, onceAmount FROM user_Med WHERE userId = '${event.source.userId}'`, (err, result) => {
      if (err) console.log('fail to SELECT', err)
      console.log(result)
      console.log()

      for (var i = 0; i < result.length; i++) {
        if (result[i].totalAmount <= result[i].onceAmount * 3) {
          message.push(
            {
              type: 'text',
              text: `警告！"${result[i].medName}"即將不足！\n請盡速捕貨`
            }
          )
        }
      }
    })

    // 因為非同步問題，所以要讓 replyMessage 延後一秒再執行，才會有所有訊息
    setTimeout(function(){client.replyMessage(event.replyToken, message);}, 1000)   // replyToken 只能用一次
  }  

}



const server = https.createServer(sslOptions, app)

server.listen(line_config.port, () => {
	console.log(`listen on port ${line_config.port}`)
})