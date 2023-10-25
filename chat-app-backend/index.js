require('dotenv').config()
const cors = require('cors');
const express = require('express')
require('./db')

const app = express()
const port = process.env.PORT

app.use(cors({
    origin: '*'
}));

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

const userRouter = require('./routers/users')
const groupChatRouter = require('./routers/groupChat')
app.use('/user', userRouter)
app.use('/group', groupChatRouter)
app.listen(port, _=>{
    console.log('listing...')
})

