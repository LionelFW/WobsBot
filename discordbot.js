/*
  A ping pong bot, whenever you send "ping", it replies "pong".
*/

// Import the discord.js module
const Discord = require('discord.js');
const utils = require('./utils.js');
try {
    var authInfo = require('./auth.json');
} catch (error) {
    console.log('Please create a file named "auth.json" following the pattern of auth.json.example' + error);
    process.exit();
}


// Create an instance of a Discord client
const client = new Discord.Client();

// The ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted
client.on('ready', () => {
  console.log('I am ready!');
  //message.channel.send('Please check the GitHub repo of your bot. The token is public, which means people can do whatever they want with the bot');
  if(authInfo.default_channel)
  {
    var channel = client.channels.find('name',authInfo.default_channel);
  }
  else
  {
    console.log('No default channel found in auth.json, connecting to first available channel...');
    var channel = utils.firstAvailableChannel(client.channels);
  }
  if(channel==false)
  {
    console.log('Channel not found. Check auth.json. Using first available channel instead');
    var channel = utils.firstAvailableChannel(client.channels);
  }

  channel.send('@dasporal je laisse la mention pour te faire chier tho');
  var adminChannel = client.channels.find('name','test');
  adminChannel.send('test');
  utils.firstAvailableChannel(client.channels);
});

// Create an event listener for messages
client.on('message', message => {

});

// Log our bot in
if(authInfo.token)
{
    client.login(authInfo.token);
}
else
{
    console.log('No token found. Check auth.json');
    process.exit();
}
