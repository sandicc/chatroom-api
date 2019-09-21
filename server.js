const express = require('express');
const app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const Client = require('pg').Client;
const cors = require('cors');
const bcrypt = require('bcrypt');


app.use(cors());
app.use(express.json());


const client = new Client({
  user: 'alex',
  host: 'localhost',
  database: 'chatroom',
  password: 'b0bmba22',
  port: 5432,
})

let milist_last = Date();
let flag = false;


client.connect();



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
    if(flag) return;
    flag = true;
    client.query(`SELECT * FROM chat_log;`)
        .then(res => {
            console.log(res.rows)
            io.emit('update', res.rows);  
        })
        .catch(err => console.log('Database error!'))
        .finally(() => flag = false);
}
const getMessages = () => {
    client.query(`SELECT * FROM chat_log WHERE time >= ${milist_last};`)
        .then(res => console.log(res.rows))
        .catch(err => console.log('Database error!'));
}


app.get('/', function (req, res) {
    res.send('Hello World');
})

app.post('/register', function (req, res) {
    const {username, email, password} = req.body;
    const hash = bcrypt.hashSync(password, 10);
    client.query(`INSERT INTO login (username, email, hash) VALUES ('${username}', '${email}', '${hash}');`)
        .then(response => res.json({insertSuccesful: true}))
        .catch(err => res.status(400).json({insertSuccesful: false}));
})

io.on('connection', (socket) => {
    console.log('user connected');
    socket.on('disconnect', (reason) => {
        console.log('user has disconnected');
    });
})
   
http.listen(3001, function(){
    console.log('listening on *:3001');
    // setInterval(update, 500);       odkomentiraj ko bo delalo --- posilja upadte na dolocen interval
});