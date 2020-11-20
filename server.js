import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'

const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) =>
  res.send('Hello World')
)

app.listen(port, () => console.log(`Server running on http://localhost:${port}`))
