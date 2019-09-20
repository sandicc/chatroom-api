const app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);



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

app.get('/', function (req, res) {
    res.send('Hello World')
})

io.on('connection', (socket) => {
    console.log('user connected');
    setTimeout(() => io.emit('update', update), 5000);
    socket.on('authentication', (data) => {
        console.log(io.clients());
    })
})
   
http.listen(3001, function(){
    console.log('listening on *:3001');
});