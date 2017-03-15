var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var users = [];
var sockets = [];

app.get('/', function(req, res){
 	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	console.log('new connection');

	var nick = 'anon';
	users.push({'nick': nick, 'id': socket.id});
	sockets.push(socket);

	socket.emit('info', 'Welcome user <strong>' + nick + '</strong> to our chat');
	socket.broadcast.emit('info', 'New user ' + nick + ' entered the chat');
	io.emit('users', users);

	socket.on('chat message', function(msg){
		io.emit('chat message', nick + ': ' + msg);
	});

	socket.on('nick', function(msg){
		var old_nick = nick;
		nick = msg;
		socket.broadcast.emit('info', 'User ' + old_nick + ' changed his nick to ' + nick);
		changeUser(old_nick, nick);
		io.emit('users', users);
	});

	socket.on('typing', function(){
		socket.broadcast.emit('typing', {id: socket.id, msg: 'User ' + nick + ' is typing'});
	});

	socket.on('disconnect', function(){
		console.log('connection lost');
		socket.broadcast.emit('info', 'User ' + nick + ' left the chat');
		changeUser(nick);
		io.emit('users', users);
	});
});

http.listen(3000, function(){
 	console.log('listening on *:3000');
});

function changeUser(nick, new_nick){
	new_nick = new_nick || '';

	for (var i = 0; i < users.length; i++)
	{
		if (users[i].nick == nick)
		{
			if (new_nick != '')
			{
				users[i].nick = new_nick;
			}
			else
			{
				users.splice(i, 1);
			}

			break;
		}
	}
}

function findSocket(id)
{
	for (var i = 0; i < sockets.length; i++)
	{
		if (sockets[i].id == id)
		{
			return sockets[i];
		}
	}

	return null;
}