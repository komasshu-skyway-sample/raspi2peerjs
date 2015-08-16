var express = require('express')
  , http = require('http')
  , app = express()
  , logger = require('log4js').getLogger()
  , WebSocket = require('ws')

var port = process.env.PORT || 3000
  , raspi_addr = process.env.RASPI_ADDR || "192.168.0.18"
  , raspi_port = process.env.RASPI_PORT || 8080
  , raspi_path = process.env.RASPI_PATH || "/stream/webrtc"
  , peerjs_scheme = process.env.PEERJS_SCHEME || "ws://" || "wss://"
  , peerjs_addr = process.env.PEERJS_ADDR || "localhost" || "skyway.io"
  , peerjs_port = process.env.PEERJS_PORT || 9000 || 443
  , peerjs_path = process.env.PEERJS_PATH || "/"
  , peerjs_key = process.env.PEERJS_APIKEY || "peerjs" || "db07bbb6-4ee8-4eb7-b0c2-b8b2e5c69ef9"
  , origin = process.env.ORIGIN || "http://localhost"

app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);

server.listen(port, function(){
    var host_ = server.address().address
      , port_ = server.address().port
    logger.info("raspi4peerjs listening at http://%s:%s", host_, port_);
});

///////////////////////////////////////////////////////////////////
// utility

var util = {};
util.randomToken = function() {
  return Math.random().toString(36).substr(2);
}

util.randomId = function(){
  return Math.floor(Math.random() * 10000);
}


///////////////////////////////////////////////////////////////////
// adapter for raspberry pi uv4l server

var raspiSocket = new WebSocket("ws://" + raspi_addr + ":" + raspi_port + raspi_path, {
  "origin": origin
});

raspiSocket.on("open", function(){
    logger.info("connection established for raspisocket");

    var test_command = { "command_id": "offer" };
    this.send(JSON.stringify(test_command));
});

raspiSocket.on("close", function(){
    logger.info("closed connection to raspisocket");
});

raspiSocket.on("message", function(data){
    logger.info("message received from raspi", data);
});


///////////////////////////////////////////////////////////////////
// adapter for raspberry pi uv4l server

var myid = util.randomId()
  , token = util.randomToken();

var peerjs_url = [
  peerjs_scheme,
  peerjs_addr,
  ":",
  peerjs_port,
  peerjs_path,
  "peerjs?key=" + peerjs_key,
  "&id=" + myid,
  "&token=" + token
].join("");

var peerjsSocket = new WebSocket(peerjs_url, { "origin": origin });

peerjsSocket.on("open", function(){
    logger.info(peerjs_url);
    logger.info("connection established for peerjs server(%s) [myid: %s, token: %s]", peerjs_addr, myid, token);
});

peerjsSocket.on("error", function(err) {
    logger.warn(err);
});

peerjsSocket.on("close", function(){
    logger.info("closed connection to peerjsSocket");
});

peerjsSocket.on("message", function(data){
    logger.info("message received from peerjs server", data);
});

//////////////////////////////////////////////////////////////////////////
// observe SIGINT
process.stdin.resume();

process.on('SIGINT', function(){
  // todo: check readystate === 1 or not
  if(raspiSocket) raspiSocket.close();
  if(peerjsSocket) peerjsSocket.close();

  logger.info("process will going down in 2 seconds...");
  setTimeout(function(ev){
    process.exit();
  }, 2000);
});
