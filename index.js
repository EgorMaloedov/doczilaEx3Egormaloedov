let path = require('path')
const express = require('express');
const request = require('request');

var app = express();
app.use('/api/*', (req, res) => {
  const apiUrl = `https://todo.doczilla.pro${req.originalUrl}`;
  request(apiUrl).pipe(res);
});
app.use(express.static(path.resolve(__dirname,'static')))
app.use(express.static(__dirname + '/public'));

app.listen(2307);