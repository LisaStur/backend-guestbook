import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import mongoose from 'mongoose'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/guest'
mongoose.connect(mongoUrl, { useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true })
mongoose.Promies = Promise

const User = mongoose.model('User', {
  name: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    default: () => crypto.randomBytes(128).toString('hex')
  }
})

const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) =>
  res.send('Hello World')
)

app.post('/users', async (req, res) => {
  try {
    const { name, password } = req.body
    const rounds = 5
    const user = new User({ name: name, password: bcrypt.hashSync(password, rounds) })
    await user.save()
    res.status(201).json({ id: user._id, accessToken: user.accessToken })
  } catch (err) {
    res.status(400).json({ message: 'Could not create user', errors: err.errors })
  }
})

app.get('/users', async (req, res) => {
  const user = await User.find()
  res.json(user)
})

app.get('/secrets', (req, res) => {
  res.json({ secret: 'Oh so secret!' })
})

app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
