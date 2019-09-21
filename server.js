const app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const Client = require('pg').Client;

const client = new Client({
  user: 'alex',
  host: 'localhost',
  database: 'chatroom',
  password: 'b0bmba22',
  port: 5432,
})

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


let update = {
    messages: messages,
    onlineUsers: onlineUsers
}

const getMessages = () => {
    client.query("SELECT * FROM chat_log;")
        .then(res => console.log(res.rows))
        .catch(err => console.log('Database Error!'));
}

getMessages();

app.get('/', function (req, res) {
    res.send('Hello World');
})

io.on('connection', (socket) => {
    console.log('user connected');
    socket.on('authentication', (data) => {
    });
    socket.on('disconnect', (reason) => {
        console.log('user has disconnected');
    });
})
   
http.listen(3001, function(){
    console.log('listening on *:3001');
    setInterval(() => io.emit('update', update), 5000);
});