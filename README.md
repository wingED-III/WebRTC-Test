# WebRTC-Test

Peer to peer video conference application. Support up to 2 people in a call. 

## Installation

### Server
**No need to run server.js on local machine. If the [server is online](https://web-rtc-test-v1.herokuapp.com/)**
#### Deploy Server locally
 1. edit WebRTC-Test/src/App.js: line 17 to:
   
            const socket = io.connect("http://localhost:5000")
 2. go to  WebRTC-Test/
 3. npm install
 4. npm start

### Client
 1. go to  WebRTC-Test/**webrtc_test**/
 2. npm install
 3. npm start

### Docker

**Run from docker container**

1. go to  WebRTC-Test/

2. run docker compose with command
    
        $ docker compose up

**Stop running**

$ docker compose down

**Accessing web application**

http://localhost:3000

## Note
 -  Change audio function only works on chromium browser (i.e. google chrom, edge, ... etc.

