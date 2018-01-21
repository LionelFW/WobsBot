const sqlite = require('sqlite3').verbose();
const fs = require('fs');

function checkRole(member, role){
    var memberRoles;
    var bFlag=false;
    try {
        memberRoles = member.roles;
    } catch (error) {
        console.log('You must pass a discord.js GuildMember as parameter');
    }
    if(role===undefined)
    {
        role='admin';
    }
    console.log('checkRole')
    memberRoles.forEach(function(value){
        console.log(value.name)
        if(value.name.toLowerCase()==role.toLowerCase()){
            bFlag = true;
        }
    });
    return bFlag;
}
exports.checkRole = checkRole;

function startDatabase(){
    let database = new sqlite.Database('./db/quotes.db', sqlite.OPEN_READWRITE,(err) => {
        if(err){
          console.log(err.message);
          let database = utils.createDatabase();
        }
    });
    let truc = utils.checkDatabase(database);
    if(truc){
      console.log('Database is valid, ready to use !');
    } else {
      console.log('Database is missing something. Trying to repair now.');
      utils.repairDatabase(database);
    }
}
exports.startDatabase = startDatabase;

function createDatabase(){
    if (!fs.existsSync('./db')){
        try {
            fs.mkdirSync('./db');
        } catch (error) {
            console.log(error + ' : couldn\'t create db folder. Exiting. (check process privileges)');
            process.exit();
        }
    }
    let database = new sqlite.Database('./db/quotes.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE ,(err) => {
        if(err){
          console.log(err.message + ' : failed to create database. Closing application.');
          process.exit();
        }
    });
    // La date sera un int : le nombre de secondes depuis le 01/01/1970 à 00:00:00
    let sqlQueryRoles = `
        CREATE TABLE IF NOT EXISTS roles (
            id INT PRIMARY KEY NOT NULL,
            rolename VARCHAR(32)
        );
    `;
    database.run(sqlQueryRoles);
    let sqlQueryUsers = `
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY NOT NULL,
            name VARCHAR(32),
            roleid INT NOT NULL,
            FOREIGN KEY (roleid) REFERENCES roles(id)
        );     
    `;
    database.run(sqlQueryUsers);
    let sqlQueryQuotes=`
        CREATE TABLE IF NOT EXISTS quotes (
        id INT PRIMARY KEY NOT NULL,
        userid INT NOT NULL,
        quote TEXT NOT NULL,
        date INT,
        FOREIGN KEY (userid) REFERENCES users(id)
    );
    `;
    database.run(sqlQueryQuotes);
    return database;
}
exports.createDatabase = createDatabase;

async function checkDatabase(database){
    let sqlQuery = `
        SELECT count(*) FROM sqlite_master WHERE type='table' AND (name='users' OR name='quotes' OR name='roles')
    `;
    return await database.get(sqlQuery, (err, row)=>{
        if(err){
            console.log(err.message);
        }
    });
}
exports.checkDatabase = checkDatabase;