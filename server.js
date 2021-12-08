require('dotenv').config()
const express=require('express')
const app= express()
const ejs= require('ejs')
const path= require('path')
const expressLayout= require('express-ejs-layouts')

const PORT = process.env.PORT || 3000
const  mongoose = require('mongoose')

const session = require('express-session')
const flash = require('express-flash')
const MongoDbStore = require('connect-mongo')
const passport= require('passport')
const Emitter = require('events')

//Database connection
const url = 'mongodb://localhost/pizza'
const connection = mongoose.connect(url,{ useNewUrlParser: true, useUnifiedTopology:true,
}).then(() => console.log('connection succesfull'))
.catch((err) => console.log(err));




// session store

// const mongoStore = new MongoDbStore({
//     mongooseConnection: connection,
//     collection: 'sessions'
// })


// Event emitter
const eventEmitter = new Emitter()
app.set('eventEmitter', eventEmitter)



//session-config
app.use(session({
    secret: process.env.COOKIE_SECRET,
    resave :false,
    store: MongoDbStore.create({
        mongoUrl:url
    }),
    saveUninitialized:false,
    cookie: { maxAge: 1000 * 60 * 60 *24 }

}))


//Passport config
const passportInit = require('./app/config/passport')
passportInit(passport)
app.use(passport.initialize())
app.use(passport.session())

app.use(flash())
app.use(express.urlencoded({extended: false}))
app.use(express.json())


//Assert

app.use(express.static('public'))


//global middleware
app.use((req, res ,next )=> {
    res.locals.session = req.session
    res.locals.user= req.user
    next()
})


// set Template engine

app.use(expressLayout)
app.set('views' ,path.join(__dirname, '/resources/views'))
app.set('view engine', 'ejs')

require('./routes/web')(app)


const server = app.listen(PORT ,()=> {
    console.log(`Listening on port ${PORT}`)
})


// Socket

const io = require('socket.io')(server)
io.on('connection', (socket) => {
      // Join
      socket.on('join', (orderId) => {
          console.log(orderId)
        socket.join(orderId)
      })
})

eventEmitter.on('orderUpdated', (data) => {
    io.to(`order_${data.id}`).emit('orderUpdated', data)
})

eventEmitter.on('orderPlaced', (data) => {
    io.to('adminRoom').emit('orderPlaced', data)
})

