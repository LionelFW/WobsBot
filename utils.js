const sqlite = require('sqlite3').verbose();
const fs = require('fs');
const quotedb = './db/quotes.db';
/*
function checkRole(member, role)
    Compares elements of member.roles to check if one matches role. If role is missing, we check if member is an "admin"
parameters :
    member : discord class Member
    role : discord class Role
returns : 
*/
function checkRole(member, role){
    var memberRoles;
    var bFlag=false;
    try {
        memberRoles = member.roles;
    } catch (error) {
        console.log('You must pass a discord.js GuildMember as parameter');
        return bFlag;
    }
    if(role===undefined)
    {
        role = 'admin';
    }
    memberRoles.forEach(function(value){
        if(value.name.toLowerCase()==role.toLowerCase()){
            bFlag = true;
        }
    });
    return bFlag;
}
exports.checkRole = checkRole;

async function startDatabase(){
    let database = new sqlite.Database(quotedb, sqlite.OPEN_READWRITE,async (err) => {
        if(err){
          console.log(err.message);
          let database = await createDatabase();
        }
    });
    return await checkDatabase(database);
}
exports.startDatabase = startDatabase;

async function createDatabase(){
    if (!fs.existsSync('./db')){
        try {
            fs.mkdirSync('./db');
        } catch (error) {
            console.log(error + ' : couldn\'t create db folder. Exiting. (check process privileges)');
            process.exit();
        }
    }
    let database = new sqlite.Database(quotedb, sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE ,(err) => {
        if(err){
          console.log(err.message + ' : failed to create database. Closing application.');
          process.exit();
        }
    });
    // La date sera un int : le nombre de secondes depuis le 01/01/1970 à 00:00:00
    let sqlQueryRoles = `
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY NOT NULL AUTOINCREMENT,
            rolename VARCHAR(32)
        );
    `;
    database.run(sqlQueryRoles);
    let sqlQueryUsers = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY NOT NULL AUTOINCREMENT,
            name VARCHAR(32),
            roleid INT NOT NULL,
            FOREIGN KEY (roleid) REFERENCES roles(id)
        );     
    `;
    database.run(sqlQueryUsers);
    let sqlQueryQuotes=`
        CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY NOT NULL AUTOINCREMENT,
        userid INT NOT NULL,
        quote TEXT NOT NULL,
        date INT,
        FOREIGN KEY (userid) REFERENCES users(id)
    );
    `;
    database.run(sqlQueryQuotes);
    let sqlQueryRolesInsert=`
        INSERT INTO roles(
            rolename
        ) values (
            "admin"
        )
    `;
    database.run(sqlQueryRolesInsert);
    let sqlQueryRolesInsertUser=`
        INSERT INTO roles(
            rolename
        ) values (
            "user"
        )
    `;
    database.run(sqlQueryRolesInsertUser);
    return database;
}
exports.createDatabase = createDatabase;

async function checkDatabase(database){
    let sqlQuery = `
        SELECT count(*) FROM sqlite_master WHERE type='table' AND (name='users' OR name='quotes' OR name='roles')
    `;
    return await database.get(sqlQuery, async (err, row)=>{
        if(err){
            console.log(err.message);
        } else {
            if(row['count(*)']===3){
                console.log('Database is valid');
            } else {
                console.log('Database invalid. Trying to repair now.');
                await createDatabase();
            }
        }
    });
}
exports.checkDatabase = checkDatabase;

async function addQuote(user, quote, isAdmin){
    var database =  new sqlite.Database(quotedb, sqlite.OPEN_READWRITE,(err)=>{
      if(err){
        console.log(err);
      }
    });
    console.log("userexists")
    await userExistsInDB(database, user)
        .then(async (result)=>{
            if(result===false){
                await createUserInDB(database, user)
                    .catch((err)=>{
                        console.log(err);
                        return;
                    });
            }
        })
        .catch((err)=>{
            console.log(err);
        });
    let findUserQuery = `
    SELECT id FROM users WHERE name = "${user}"
    `;
    console.log(findUserQuery)
    await database.get(findUserQuery,async (err, row)=>{
        if(err){
            console.log(err);
            return;
        }
        let posixTimestamp = new Date() / 1000;
        let sqlQuery  = `
        INSERT INTO quotes (
            userid,
            quote,
            date
        ) VALUES (
            ${row["id"]},
            "${quote}",
            ${posixTimestamp}
        )
        `;
        console.log(sqlQuery)
        await database.run(sqlQuery, (err)=>{
            if(err){
                console.log(err + ' : could not add quote to database');
                return;
            }
        });
    });
    return database;
}
exports.addQuote = addQuote;

async function userExistsInDB(database, username){
    var bFlag = false;
    let sqlQuery = `
        SELECT count(*) FROM users WHERE name = "${username}"
    `;
    console.log(sqlQuery);
    return await new Promise(function (resolve, reject){
        database.get(sqlQuery, (err, row)=>{
            if(err){
                reject(err);
                return;
            }
            else{
                if(row['count(*)']===1){
                    resolve(true);
                    return;
                } else {
                    resolve(false);
                    return;
                }
            }
        });
    });
}

async function createUserInDB(database, user, isAdmin){
    let roleId;
    if (isAdmin){
        roleId = 1;
    } else {
        roleId = 2;
    }
    let sqlQuery = `
        INSERT INTO users (
            name,
            roleid
        ) values (
            "${user}",
            ${roleId}
        )
    `;
    return await new Promise( function(resolve, reject) {
        database.run(sqlQuery,(err)=>{
            if(err){
                reject(err);
                return;
            }
        });
    });
}

function posixToDate(posixtimestamp){

    return convertedDate;
}