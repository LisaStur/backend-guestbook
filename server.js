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

const Message = mongoose.model('Message', {
  text: {
    type: String,
    requiered: true,
    minlength: 5,
    maxlength: 200
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  like: {
    type: Number,
    default: 0
  }
})

const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(bodyParser.json())

/*
app.use((req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    next()
  } else {
    res.status(503).json({ error: 'Service unavaiable' })
  }
}) */

const authenticateUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ accessToken: req.header('Authorization') })
    if (user) {
      req.user = user
      next()
    } else {
      res.status(401).json({ loggedOut: true })
    }
  } catch (err) {
    res.stauts(403).json({ message: 'Access token missing or wrong' })
  }
}

app.get('/', (req, res) =>
  res.send('Lisas Guestbook')
)

// Create user
app.post('/users', async (req, res) => {
  try {
    const { name, password } = req.body
    const rounds = 5
    const user = new User({ name: name, password: bcrypt.hashSync(password, rounds) })
    await user.save()
    res.status(201).json({ userId: user._id, accessToken: user.accessToken })
  } catch (err) {
    res.status(400).json({ message: 'Could not create user', errors: err.errors })
  }
})

app.get('/users', async (req, res) => {
  const users = await User.find()
  res.json(users)
})

// Login user
app.post('/sessions', async (req, res) => {
  try {
    const { name, password } = req.body
    const user = await User.findOne({ name })
    if (user && bcrypt.compareSync(password, user.password)) {
      res.status(201).json({ userId: user._id, accessToken: user.accessToken })
    } else {
      res.status(404).json({ notFound: true })
    }
  } catch (err) {
    res.status(404).json({ notFound: true })
  }
})

app.post('/messages', authenticateUser)
app.post('/messages', async (req, res) => {
  try {
    const { text } = req.body
    const message = await new Message({ text, author: req.user._id }).save()
    res.status(201).json(message)
  } catch (err) {
    res.status(400).json({ message: 'Could not save message', errors: err.errors })
  }
})

// app.get('/messages', authenticateUser)
app.get('/messages', async (req, res) => {
  const messages = await Message.find().populate('author', 'name').sort({ createdAt: 'desc' }).limit(5).exec()
  res.json(messages)
})

app.put('/messages/:messageId/like', async (req, res) => {
  try {
    const { messageId } = req.params
    const message = await Message.findOneAndUpdate({ _id: messageId }, { $inc: { like: 1 } })
    res.status(201).json(message)
  } catch (err) {
    res.status(400).json({ message: 'Could not like post, not found', error: err.errors })
  }
})

app.get('/testingauths', authenticateUser)
app.get('/testingauths', (req, res) => {
  res.json({ test: 'Testing Authorisation' })
})

app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
