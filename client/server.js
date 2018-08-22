var express = require('express');
var app = express();

app.use(express.static('public'));

var keystore = {};

app.post('/keystore/:key/:value', function(req, res) {
   keystore[req.params.key] = req.params.value;
   console.log("POST request " + req.params.key + " -> " + keystore[req.params.key]);
   res.send(keystore[req.params.key]);
});

app.get('/keystore/:key', function(req, res) {
	console.log("GET request " + req.params.key + " -> " + keystore[req.params.key]);
   res.send(keystore[req.params.key]);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
