const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require("fs");
const config = require("./config.json");
const IDGen = require("./utils/idgen");
const Message = require("./utils/Message");
const id = new IDGen();

var validateUsername = username => username.match(/^[a-zA-Z0-9]+$/) !== null;
var usernames = [];
var plugins = [];

app.use(express.static(__dirname + "/public"));
io.use((socket, next) => {
  var sessionID = socket.handshake.auth.sessionID;
  var username = socket.handshake.auth.username;
  var room = socket.handshake.auth.room;

  if (!validateUsername(username)) {
    next(new Error("invalid username"));
  } else if (!config.rooms.includes(room)) {
    next(new Error("invalid room"));
  } else if (usernames.includes(username.toLowerCase())) {
    next(new Error("username taken"));
  } else {
    socket.sessionID = sessionID.length === 0 ? id.generate() : sessionID;
    socket.username = username;
    socket.room = room;
    socket.badge = null;
    socket.kick = reason => {
      socket.emit("kick", reason);
      socket.disconnect();
    };
    socket.join(room);
    usernames.push(username.toLowerCase());
    next();
  }
});

if (!fs.existsSync("./plugins")) {
  fs.mkdirSync("./plugins");
}
const pls = fs.readdirSync("./plugins").filter(file => file.endsWith(".js"));

for (const pl of pls) {
  console.log(`Loading plugin: ${pl}`);
  const plugin = require(`./plugins/${pl}`);
  if (!plugin.ignoreplugin) plugins.push(plugin);
  else console.log(`Ignoring plugin: ${pl}`);
}

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/chat/:room", (req, res) => {
  res.sendFile(__dirname + "/views/chat.html");
});

app.get("/api/rooms", (req, res) => {
  var rooms = config.rooms.filter((room, idx) => {
    return config.rooms.indexOf(room) === idx;
  });

  res.json(rooms);
});

io.on("connection", socket => {
  console.log(`${socket.username}@${socket.room} has connected`);

  plugins.forEach(plugin => {
    if (plugin.onConnect) {
      plugin.onConnect(socket);
    }
  });

  io.emit("update_users", io.of("/").sockets.size);
  io.emit("session", { sessionID: socket.sessionID });

  socket.on("disconnect", () => {
    console.log(`${socket.username}@${socket.room} has disconnected`);
    io.emit("update_users", io.of("/").sockets.size);
    usernames = usernames.filter(username => username === socket.username);
  });

  socket.on("send_message", message => {
    if (message.trim() === "") return;

    var send = true;

    var msgForPl = new Message(io, socket, message);
    plugins.forEach(plugin => {
      if (plugin.onMessage) {
        msgForPl.subs.cancel = () => {
          send = false;
        };
        plugin.onMessage(msgForPl);
      }
    });

    setTimeout(() => {
      if (send) {
        io.to(socket.room).emit("new_message", {
          author: {
            username: socket.username,
            badge: socket.badge
          },
          content: message
        });
      }
    }, 1000);
  });
});

server.listen(3000, () => {
  console.log("listening on *:3000");
});
