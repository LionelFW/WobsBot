/*
  The WobsBot. Wobs' Bot that Wobs
*/

//Imports
const Discord = require('discord.js');
const utils = require('./utils.js');
const sqlite = require('sqlite3').verbose();
var serverInfo;
try {
  serverInfo = require('./auth.json');
} catch (error) {
  console.log(`Please create a file named "auth.json" following the pattern of auth.json.example, ` + error);
  process.exit();
}

const client = new Discord.Client();

//On ready handler
client.on('ready', () => {
  var channel;
  console.log('I am ready!');
  let database = new sqlite.Database('./db/quotes.db', sqlite.OPEN_READWRITE,async (err) => {
    if(err){
      console.log(err.message);
      let database = await utils.createDatabase();
    }
    let truc = await utils.checkDatabase(database);
    if(truc){
      console.log('Database is valid, ready to use !');
    } else {
      console.log('Database is missing something. Trying to repair now.');
      //utils.repairDatabase(database);
    }
  });
  client.user.setPresence({
    game: {
      name: 'with your mind',
    },
    status: 'online',
    afk: false,
  });
  // Eventually, I'd like to make it so that the bot looks for the first available channel if none is mentionned in auth.json
  if (serverInfo.default_channel) {
    channel = client.channels.find('name', serverInfo.default_channel);
  } else {
    console.log('No default channel found in auth.json');
    process.exit();
  }
  if (channel === false) {
    console.log('Channel not found. Check auth.json.');
    process.exit();
  }
  channel.send('@dasporal je laisse la mention pour te faire chier tho')
    .then((message)=>logMessage(message));
});

//Messages handler
client.on('message', (message) => {
  if(message.content.startsWith('w!changegame')){
    if(!utils.checkRole(message.member, serverInfo.admin_rank)){
      return;
    }
    let parsedCommand = message.content.split(/ (.+)/)[1];
    let oldPresenceGame = client.user.presence.game
    client.user.setPresence({
      game: {
        name: parsedCommand
      }
    })
      .then(user=>{
        if(user.presence.game === oldPresenceGame){
          console.log('Presence did not change');
        } else {
          console.log('Presence changed to ' + user.presence.game.name);
        }
      });
  }
});

client.on('presenceUpdate', (oldMember, newMember) => {
  console.log('event')
  if(newMember.presence.game===null)
  {
    return;
  }
  if(newMember.presence.game.name==='Fortnite'){
    channel.send('@everyone')
      .then((message)=>logMessage(message));
  }
});

//Bot Login
if (serverInfo.bot_token) {
  client.login(serverInfo.bot_token);
} else {
  console.log('No token found. Check auth.json');
  process.exit();
}

process.on('SIGINT', () => {
  console.log('Exiting...');
  process.exit();
});

function logMessage(message){
  console.log('Message sent : "' + message.content + '" on channel ' + message.channel);
}