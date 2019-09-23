const express = require('express');
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const Client = require('pg').Client;
const cors = require('cors');
const bcrypt = require('bcrypt');
const socketio_auth = require('socketio-auth');

app.use(cors());
app.use(express.json());

const client = new Client({
  user: 'alex',
  host: 'localhost',
  database: 'chatroom',
  password: 'b0bmba22',
  port: 5432,
})

client.connect();

const authenticate = (socket, data, callback) => {
    let {username, password} = data;
    client.query(`SELECT * FROM login WHERE username = '${username}';`)
        .then(res => callback(null, bcrypt.compareSync(password, res.rows[0].password)))
        .catch(err => callback(new Error("User not found")));
}

const userAlreadyConnedted = (username, socID) => {
    let {sockets} = io.sockets;
    for(socketID in sockets){
        if(socID !== socketID && sockets[socketID].client.user.username === username){
            return true;
        }
    }
    return false;
}

const postAuthenticate = (socket, data) => {
    let {username} = data;
    if(userAlreadyConnedted(username, socket.id)) {
        console.log('User already connected!!!!')
        socket.disconnect(true);
        return;
    }
    // console.log(socket.client);
    client.query(`SELECT id FROM login WHERE username = '${username}';`)
        .then(res => {
            socket.client.user = {
                username: username,
                id: res.rows[0].id
            }
            socket.emit('authentication', {auth: true});
        })
        .catch(err => callback(new Error("User not found")));
}

socketio_auth(io,{
    authenticate: authenticate,
    postAuthenticate: postAuthenticate,
    timeout: 5000
});

let milist_last = new Date(Date.now());
let  messageTS = new Date();
let busy = false;

let messages = [
    {
        username: 'alex',
        message: 'kako si',
        id: 1
    },
    {
        username: 'filip',
        message: 'dobro ti ?',
        id:2
    },
    {
        username: 'alex',
        message: 'super adijo',
        id:3
    },
    {
        username: 'filip',
        message: 'adijo',
        id:4
    }
]

let onlineUsers = [
    {
        username: 'alex',
        id: 1
    },
    {
        username: 'filip',
        id:2
    },
    {
        username: 'tom',
        id:3
    },
    {
        username: 'george',
        id:4
    }
]


const update = () => {
    if(busy) return;
    busy = true;
    getNewMessages().then(messages => {
        let data = {
            messages: messages,
            onlineUsers: getOnlineUsers()
        }
        console.log(data)
        io.emit('update', data);
    }).catch(err => 'Error accessing database')
    .finally(() => busy = false);
}

const getNewMessages = () => {
    const condition = `${milist_last.getFullYear()}`+
                       `-${milist_last.getMonth()}`+
                       `-${milist_last.getDate()}`+  
                       ` ${milist_last.getHours()}`+
                       `:${milist_last.getMinutes()}`+
                       `:${milist_last.getSeconds()}`+
                       `.${milist_last.getMilliseconds().toString().padStart(3, '0')}`;
    console.log('Update at ' + milist_last.getTime() + 'with condition: ' + condition)
    milist_last.setTime(Date.now());
    // console.log('Next update from ' + Date.now());
    return client.query(`SELECT message,username,id FROM chat_log WHERE time >= '${condition}';`)
        .then(res => res.rows);
}

const getOnlineUsers = () => {
    let onlineUsers = [];
    const connectedSockets = io.sockets.connected;
    for(socketID in connectedSockets){
        onlineUsers.push(connectedSockets[socketID].client.user);  // onlineUsers je array user objektov, dodaj objekt vsako iteracijo
    }
    return onlineUsers;
}

app.get('/', function (req, res) {
    res.send('Hello World');
})

app.post('/register', function (req, res) {
    const {username, email, password} = req.body;
    const hash = bcrypt.hashSync(password, 10);
    client.query(`INSERT INTO login (username, email, password) VALUES ('${username}', '${email}', '${hash}');`)
        .then(response => res.json({insertSuccessful: true}))
        .catch(err => res.status(400).json({insertSuccessful: false}));
})

app.post('/login', function (req, res) {
    const {username, password} = req.body;
    client.query(`SELECT * FROM login WHERE username = '${username}';`)
        .then(response => {
            bcrypt.compareSync(password, response.rows[0].password) ? 
                res.json({loginSuccessful: true}) :
                res.status(400).json({loginSuccessful: false});
        })
        .catch(err => res.status(400).json({loginSuccesful: false}));
})

io.on('connection', (socket) => {
    console.log('user connected');
    socket.on('disconnect', (reason) => {
        console.log('user has disconnected');
    });

    socket.on('message', (data) => {
        let {message} = data;
        let {username} = socket.client.user;
        messageTS.setTime(Date.now());
        console.log('Message time ' + Date.now());
        const time = `${messageTS.getFullYear()}`+
                       `-${messageTS.getMonth()}`+
                       `-${messageTS.getDate()}`+  
                       ` ${messageTS.getHours()}`+
                       `:${messageTS.getMinutes()}`+
                       `:${messageTS.getSeconds()}`+
                       `.${messageTS.getMilliseconds().toString().padStart(3, '0')}`;
        client.query(`INSERT INTO chat_log (username, message, time) VALUES ('${username}', '${message}', '${time}');`)
            .then(res => {})
            .catch(res => console.log('failed to insert message into database'));
    })
})


http.listen(3002, function(){
    console.log('listening on *:3001');
    setInterval(update, 50);       //odkomentiraj ko bo delalo --- posilja upadte na dolocen interval
});