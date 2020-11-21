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

const authenticateUser = async (req, res, next) => {
  const user = await User.findOne({ accessToken: req.header('Authorization') })
  if (user) {
    req.user = user
    next()
  } else {
    res.status(401).json({ loggedOut: true })
  }
}

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

app.post('/sessions', async (req, res) => {
  const user = await User.findOne({ name: req.body.name })
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    res.json({ userId: user._id, accessToken: user.accessToken })
  } else {
    res.json({ notFound: true })
  }
})

app.get('/testingauths', authenticateUser)
app.get('/testingauths', (req, res) => {
  res.json({ test: 'Testing Authorisation' })
})

app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
