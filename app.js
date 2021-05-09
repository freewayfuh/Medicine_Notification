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
app.get('/medicine_detail', (req, res) => {
  res.render('medicine_detail')
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


app.get('/load-medDetail', (req, res) => {
  connection.query(`INSERT INTO user_Med(medName, totalAmount, onceAmount, userId) VALUES ('${req.query.medName}', ${req.query.totalAmount}, ${req.query.onceAmount}, '${req.query.userId}')`,(err, result) => {
    if(err) console.log('fail to select:', err)
    //console.log(result)
    res.send('success')
  })
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
app.get('/load-notifyPage', (req, res) => {
  console.log(req.query.userId)
  connection.query(`SELECT * FROM user_Notify WHERE userId='${req.query.userId}'`,(err, result) => {
    if(err) console.log('fail to select:', err)
    console.log(result)
    res.send(result)
  })

})


const client = new line.Client(lineConfig)

  
function handleEvent(event) {

  if(event.type == 'follow'){
    client.getProfile(event.source.userId).then((profile) => {
      
      connection.query(`INSERT INTO user_Info(userId, userName, picture) VALUES ('${profile.userId}','${profile.displayName}','${profile.pictureUrl}')`, (err, result) => {
        if(err) console.log('fail to insert:', err)
      })
      
      console.log(profile.pictureUrl)
      console.log(profile.displayName)
      console.log(profile.userId)
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
