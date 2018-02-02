/*
  The WobsBot. Wobs' Bot that Wobs
*/

//Imports
const Discord = require('discord.js');
const utils = require('./utils.js');
const sqlite = require('sqlite3').verbose();
const quotedb = './db/quotes.db';
var serverInfo;
try {
  serverInfo = require('./auth.json');
} catch (error) {
  console.log(`Please create a file named "auth.json" following the pattern of auth.json.example, ` + error);
  process.exit();
}

const client = new Discord.Client();
//At first, we try to connect to the database, we then check its "integrity", and repair it if needed
var database = utils.startDatabase();

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

  // Eventually, I'd like to make it so that the bot looks for the first available channel if none is mentionned in auth.json
  if (serverInfo.default_channel) {
    console.log('Default channel : ' + serverInfo.default_channel)
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
  // Should use commando
  if(message.content.startsWith('w!changegame')){
    if(!utils.checkRole(message.member, serverInfo.admin_rank)){
      return;
    }
    let parsedCommand = message.content.split(/ (.+)/)[1];
    let oldPresenceGame = client.user.presence.game;
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

  if(message.content.startsWith('w!addquote')){
    let parsedCommand = message.content.split(' ');
    var quote='';
    parsedCommand.forEach(element => {
      if(parsedCommand.indexOf(element)!==0 & parsedCommand.indexOf(element)!==(parsedCommand.length-1)){
        quote += ' ' + element;
      }
    });
    if(!utils.checkRole(message.member, 'admin')){
      return;
    };
    console.log(quote)
    if(quote !== ''){
      try{
        utils.addQuote(parsedCommand[parsedCommand.length - 1], quote, true);
      } catch(error) {
        console.log(error);
        return;
      }
    }
  };

  if(message.content.startsWith('w!randomquote')){
    console.log('About to send a quote...')
    let database = new sqlite.Database(quotedb, sqlite.OPEN_READWRITE ,(err) => {
      if(err){
        console.log(err);
      }
    });
    utils.getNbQuotes(database)
      .then(async (result) => {
        id = getRandomInt(result["count(*)"])+1;
        await utils.getQuoteById(database, id)
          .then((result) => {
            utils.formatQuote(database, result)
              .then((result) => {
                message.channel.send(result)
                  .then((message) => {
                    logMessage(message);
                  })
                  .catch((err) => {
                    console.log(err.message + ',' + err.code + ',' + err.name);
                  })
                })
              .catch((err)=>{
                console.log(err)
              })
          })
          .catch((err) => {
            console.log(err)
          });
      });
  }
});
/*
client.on('presenceUpdate', (oldMember, newMember) => {
  if(newMember.presence.game === null)
  {
    return;
  }
  console.log(newMember.presence.game.name);
  if(newMember.presence.game.name==='Fortnite'){
    channel.send('@everyone')
      .then((message)=>logMessage(message));
  }
})
*/

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
  console.log('Message sent : "' + message.content + '" on channel : ' + message.channel.name);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}