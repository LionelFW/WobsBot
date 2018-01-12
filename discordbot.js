/*
  The WobsBot. Wobs' Bot that Wobs
*/

//Imports
const Discord = require('discord.js');
const utils = require('./utils.js');
var authInfo;
try {
  authInfo = require('./auth.json');
} catch (error) {
  console.log(`Please create a file named "auth.json" following the pattern of auth.json.example${error}`);
  process.exit();
}

const client = new Discord.Client();

//On ready handler
client.on('ready', () => {
  var channel;
  console.log('I am ready!');
  client.user.setPresence({
    game: {
      name: 'with your mind',
    },
    status: 'online',
    afk: false,
  });
  if (authInfo.default_channel) {
    channel = client.channels.find('name', authInfo.default_channel);
  } else {
    console.log('No default channel found in auth.json');
    process.exit();
  }
  if (channel === false) {
    console.log('Channel not found. Check auth.json.');
    process.exit();
  }
  channel.send('@dasporal je laisse la mention pour te faire chier tho');
});

//Messages handler
client.on('message', (message) => {
  if(message.content.startsWith('w!changegame')){
    let parsedCommand = message.content.split(' ')[1];
    console.log('Game changed to : ' + parsedCommand);
    client.user.setPresence({
      game: {
        name: parsedCommand
      }
    });
  }
});

client.on('presenceUpdate', (oldMember, newMember) => {
  console.log('presenceUpdate', oldMember.presence + ' /// '+ newMember.presence);
  if(newMember.presence.game.name==='Fortnite'){
    channel.send('@everyone IL JOUE A FORTNITE AHAHAHAH');
  }
});

//Bot Login
if (authInfo.bot_token) {
  client.login(authInfo.bot_token);
} else {
  console.log('No token found. Check auth.json');
  process.exit();
}

// //Exit handler
// function exitHandler(){
//   console.log('Exitting, destroying bot...');
//   client.destroy();
//   process.exit();
// }

// process.on('SIGINT', exitHandler);