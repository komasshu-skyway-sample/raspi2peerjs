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
});

raspiSocket.on("close", function(){
    logger.info("closed connection to raspisocket");
});

raspiSocket.on("message", function(msg){
    logger.info("message received from raspi", msg);

    try{
      // check whether peer connection is established or not.
      if(!peer_id) {
        logger.warn("receive message from raspi-cam, but there is no peer connection");
        return;
      }

      var msg_ = JSON.parse(msg);
      var type = null;

      switch(msg_.type) {
      case "offer":
        type = "OFFER";
        break;
      case "geticecandidate":
        type = "CANDIDATE";
        break;
      default:
      }

      if(type) {
        peerjsSocket.send(JSON.stringify({
          "type": type,
          "src": myid,
          "dst": peer_id,
          "payload": msg_
        }));
      } else {
        logger.warn("received invalid message from raspi-cam");
      }
    } catch(e) {
      logger.error(e);
    }
});


///////////////////////////////////////////////////////////////////
// adapter for raspberry pi uv4l server

var myid = util.randomId()
  , token = util.randomToken()
  , peer_id = null;

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

peerjsSocket.on("message", function(msg){
    logger.info("message received from peerjs server", msg);

    try{
      var msg_ = JSON.parse(msg);
      var data = null;

      switch(msg_.type) {
      case "OPEN":
        return;
        break;
      case "OFFER":
        peer_id = msg_.src;
        data = msg_.payload;
        break;
      case "ANSWER":
      case "CANDIDATE":
      case "LEAVE":
        if(!!peer_id || peer_id === msg_.src) {
          data = msg_.payload;
        }
        break;
      default:
      }

      if(data) {
        raspiSocket.send(JSON.stringify(data));
      } else {
        logger.warn("received invalid message from peer server");
      }
    } catch(e) {
      logger.error(e);
    }
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
