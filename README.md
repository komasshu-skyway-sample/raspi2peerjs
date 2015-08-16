# raspi2peerjs

## how to use

```
please be notify that current version doesn't connect to skyway server. cause automatically close from SkyWay in 30seconds...
```

### preparation

you need to run peerjs-server in your local machine.
```
$ node -g install peer
$ peer --port 9000 --key peerjs
```

check raspberry pi's IP addresss ( assuming raspi's address is 192.168.0.3 below )

1. clone this repo
2. run raspi2peerjs server
```
$ cd rasp2peerjs
$ RASPI_ADDR=192.168.0.3 node index.js
```

3. after that you'll see the messages like below,
```
[2015-08-16 22:42:30.972] [INFO] [default] - raspi4peerjs listening at http://0.0.0.0:3000
[2015-08-16 22:42:30.978] [INFO] [default] - ws://localhost:9000/peerjs?key=peerjs&id=3689&token=b65tvmili2mon7b9
[2015-08-16 22:42:30.978] [INFO] [default] - connection established for peerjs server(localhost) [myid: 3689, token: b65tvmili2mon7b9]
```
please check myid ( above example, it is 3689 )

4. access URL "http://localhost:3000"

- change text box labeled *Peer ID for destination:* with above ``myid``. 
- click *start*



