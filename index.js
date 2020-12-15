'use strict'

const express = require('express')
const metricsMiddleware = require('./metrics')

const app = express()

app.use(metricsMiddleware())

// Hello
app.get('/', function root(_, res, next) {
  res.send('hello world\n')
})

// Server run
const port = 8000
app.listen(port, err => {
  if (err) {
    e => console.log(`Error: ${e}`)
  } else {
    console.log(`Example app listening on port ${port}!`)
  }
})
