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

const postAuthenticate = (socket, data) => {
    let {username} = data;
    // console.log(socket.client);
    client.query(`SELECT id FROM login WHERE username = '${username}';`)
        .then(res => {
            socket.client.user = {
                username: username,
                id: res.rows[0].id
            }
        })
        .catch(err => callback(new Error("User not found")));
}

socketio_auth(io,{
    authenticate: authenticate,
    postAuthenticate: postAuthenticate,
    timeout: 5000
});

let milist_last = new Date(Date.now());
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
    const condition = `'${milist_last.getFullYear()}`+
                       `-${milist_last.getMonth()}`+
                       `-${milist_last.getDate()}`+  
                       ` ${milist_last.getHours()}`+
                       `:${milist_last.getMinutes()}`+
                       `:${milist_last.getSeconds()}`+
                       `.${milist_last.getMilliseconds()}'`;
    console.log(condition);
    milist_last.setTime(Date.now());
    return client.query(`SELECT message,username,id FROM chat_log WHERE time >= ${condition};`)
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
    client.query(`INSERT INTO login (username, email, hash) VALUES ('${username}', '${email}', '${password}');`)
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
})

http.listen(3002, function(){
    console.log('listening on *:3001');
    setInterval(update, 500);       //odkomentiraj ko bo delalo --- posilja upadte na dolocen interval
});