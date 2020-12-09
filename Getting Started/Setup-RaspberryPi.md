# Setup of a Raspberry Pi
This explains how to setup a raspberry pi as a server,
running both a httpserver (more info: [here](https://github.com/EspenBG/webserver/blob/master/README.md)) and the socket.io.

Setup of the raspberry pi

Recommended:
- Make new account and delete the default user (pi)
- Set a static ip address for Pi
- Using vim as text editor (or nano)
- Move SSH to a different port (makes the connection more secure, everyone tries 22)
- Enabled SSH to remote control

Required:
- Setup IPTables to accept connections to the servers.
- install node.js (npm install right dependencies)
- git clone repo
-