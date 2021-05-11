const fs = require('fs')
const https = require('https')
const express = require('express')
const app = express()
const line = require('@line/bot-sdk')
const line_config = require('./config/line.js')
const mysql = require('mysql')
const db_config = require('./config/db.js')

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
app.get('/contact', (req, res) => {
  res.render('contact')
})

app.get('/med_notify', (req, res) => {
  res.render('med_notify')
})

app.post('/webhook', line.middleware(lineConfig), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
})

//Pill Box
app.get('/load-pillBoxPage', (req, res) => {
  console.log(req.query.userId)
  connection.query(`SELECT * FROM user_Med WHERE userId='${req.query.userId}'`,(err, result) => {
    if(err) console.log('fail to select:', err)
    //console.log(result)
    res.send(result)
  })

})


app.get('/add-med', (req, res) => {  
  if(req.query.queryCond == 'insert'){
    connection.query(`INSERT INTO user_Med(medName, totalAmount, onceAmount, userId) VALUES ('${req.query.medName}', ${req.query.totalAmount}, ${req.query.onceAmount}, '${req.query.userId}')`,(err, result) => {
      if(err) console.log('fail to insert:', err)
    })
  }else if(req.query.queryCond == 'update'){
    connection.query(`UPDATE user_Med SET medName='${req.query.medName}', totalAmount=${req.query.totalAmount}, onceAmount=${req.query.onceAmount} WHERE user_MedId=${req.query.user_MedId}`,(err, result) => {
      if(err) console.log('fail to update:', err)
    })
     
  }
  res.send('success')
})


app.get('/edit-med', (req, res) => {
  console.log(req.query.user_MedId)
  connection.query(`SELECT * FROM user_Med WHERE user_MedId=${req.query.user_MedId}`,(err, result) => {
    if(err) console.log('fail to select:', err)
    res.send(result)
  })  
})


app.get('/delete-med', (req, res) => {
  console.log(req.query.user_MedId)
  connection.query(`DELETE FROM user_Med WHERE user_MedId=${req.query.user_MedId}`,(err, result) => {
    if(err) console.log('fail to delete:', err)
    res.send('delete success')
  })  
})


//Notify
app.get('/get-notify', (req, res) => {
  console.log(req.query.userId)
  connection.query(`SELECT * FROM user_Notify WHERE userId='${req.query.userId}' ORDER BY notifyTime`,(err, result) => {
    if(err) console.log('fail to select:', err)
    console.log(result)
    res.send(result)
  })

})

app.get('/get-med-notify', (req, res) => {
  connection.query(`SELECT * FROM Notify_Med, user_Med WHERE user_NotifyId='${req.query.user_NotifyId}' AND Notify_Med.user_MedId = user_Med.user_MedId`,(err, result) => {
    if(err) console.log('fail to select:', err)
    console.log(result)
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
  let user_NotifyId
  connection.query(`INSERT INTO user_Notify(notifyTime, userId) VALUES ('${req.query.hour}:${req.query.min}','${req.query.userId}')`,(err, result) => {
    if(err) console.log('fail to select:', err)
  })
  connection.query(`SELECT user_NotifyId FROM user_Notify WHERE notifyTime='${req.query.hour}:${req.query.min}' AND userId='${req.query.userId}'`,(err, result) => {
    if(err) console.log('fail to select:', err)
    user_NotifyId = result[0].user_NotifyId
  })
  req.query.user_MedId.forEach(element => {
    connection.query(`INSERT INTO Notify_Med(user_NotifyId, user_MedId) VALUES (${user_NotifyId}, ${element})`,(err, result) => {
      if(err) console.log('fail to select:', err)
    })    
  })
  res.send('success')
})

app.get('/edit-notify', (req, res) => {
  console.log('editing')
  res.send('success') 
})

app.get('/delete-notify', (req, res) => {
  console.log(req.query.user_NotifyId)
  connection.query(`DELETE FROM user_Notify WHERE user_NotifyId=${req.query.user_NotifyId}`,(err, result) => {
    if(err) console.log('fail to delete:', err)
    res.send('delete success')
  })  
})


const client = new line.Client(lineConfig)

  
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
  }

  if(event.type == 'unfollow'){
    connection.query(`DELETE FROM user_Info WHERE userId='${event.source.userId}'`, (err, result) => {
      if(err) console.log('fail to delete:', err)
    })
  }




  console.log(event)
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null)
  }

  if (event.message.id == '100001') return 200 // to deal with verify dummy data

  return client.replyMessage(event.replyToken, { 
    type: 'text',
    text: event.message.text
  })
}


const server = https.createServer(sslOptions, app)

server.listen(line_config.port, () => {
	console.log(`listen on port ${line_config.port}`)
})
