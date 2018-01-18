const sqlite = require('sqlite3').verbose();

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

function createDatabase(){
    let database = new sqlite.Database('./db/quotes.db', sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE ,(err) => {
        if(err){
          return console.log(err.message + ' : failed to create database. Closing application.');
          return false;
        }
    });
    // La date sera un int : le nombre de secondes depuis le 01/01/1970 à 00:00:00
    let sqlQueryUsers = `
        CREATE TABLE IF NOT EXISTS users (
            id INT PRIMARY KEY NOT NULL,
            name VARCHAR(32)
        );     
    `
    database.run(sqlQueryUsers);
    let sqlQueryQuotes=`
        CREATE TABLE IF NOT EXISTS quotes (
        id INT PRIMARY KEY NOT NULL,
        userid INT NOT NULL,
        quote TEXT NOT NULL,
        date INT
    );
    `
    database.run(sqlQueryQuotes);
    return database;
}
exports.createDatabase = createDatabase;

function checkDatabase(database){
    let sqlQuery = `
        SELECT count(*) FROM sqlite_master WHERE type='table' AND (name='users' OR name='quotes')
    `;
    database.get(sqlQuery, (err, row)=>{
        if(err){
            console.log(err.message);
        }
        callback(row)
    });


}
exports.checkDatabase = checkDatabase;