const sqlite = require('sqlite3').verbose();
const fs = require('fs');
const quotedb = './db/quotes.db';

/*
function checkRole(member, role):
    Compares elements of member.roles to check if one matches role. If role is missing, we check if member is an "admin"
parameters:
    member: discord class Member
    role: discord class Role
returns:
    boolean
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
    if(role === undefined)
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
/*
function startDatabase()
    starts the database
returns :
    database object. Kept as part of the sqlite3 chaining philosophy
*/
async function startDatabase(){
    console.log('Starting database...');
    let database = await new sqlite.Database(quotedb, sqlite.OPEN_READWRITE ,async (err) => {
        if(err){
          let database = await createDatabase();
        }
    });
    return await checkDatabase(database);
}
exports.startDatabase = startDatabase;

/*
function createDatabase()
    Creates the database
returns:
    database object. Kept as part of the sqlite3 chaining philosophy

Not really neat code (the whole project isn't...) but does the job. Will rework eventually
*/
async function createDatabase(){
    console.log('Creating database...');
    if (!fs.existsSync('./db')){
        try {
            fs.mkdirSync('./db');
        } catch (error) {
            console.log(error + ' : couldn\'t create db folder. Exiting. (check process privileges)');
            process.exit();
        }
    }
    var database = await new sqlite.Database(quotedb, sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE ,(err) => {
        if(err){
          console.log(err.message + ' : failed open database. Closing application.');
          database.close();
          process.exit();
        }
    });

    // La date sera un int : le nombre de secondes depuis le 01/01/1970 à 00:00:00
    let sqlQueryRoles = `
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            rolename VARCHAR(32)
        );
    `;
    console.log("Creating roles table...");
    database = await database.run(sqlQueryRoles);

    let sqlQueryUsers = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            name VARCHAR(32),
            roleid INT NOT NULL,
            FOREIGN KEY (roleid) REFERENCES roles(id)
        );     
    `;
    console.log("Creating users table...");
    database = await database.run(sqlQueryUsers);

    let sqlQueryQuotes=`
        CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        userid INT NOT NULL,
        quote TEXT NOT NULL,
        date INT,
        FOREIGN KEY (userid) REFERENCES users(id)
    );
    `;
    console.log("Creating quotes table...");
    database = database.run(sqlQueryQuotes,()=>{
        let sqlQueryRolesInsert=`
        INSERT INTO roles(
            rolename
        ) values (
            "admin"
        )
        `;
        console.log("Inserting admin value into roles...");
        database = database.run(sqlQueryRolesInsert);

        let sqlQueryRolesInsertUser=`
            INSERT INTO roles(
                rolename
            ) values (
                "user"
            )
        `;
        console.log("Inserting user value into roles...");
        database = database.run(sqlQueryRolesInsertUser);
    })

    //infinite loop risk ?
    return await checkDatabase(database);
}
exports.createDatabase = createDatabase;

/*
function checkDatabase(database)
    checks the "database" database
parameters: 
    database : sqlite3 database object
returns:
    database object. Kept as part of the sqlite3 chaining philosophy
*/
async function checkDatabase(database){
    console.log('Checking database...');
    let sqlQuery = `
        SELECT count(*) FROM sqlite_master WHERE type='table' AND (name='users' OR name='quotes' OR name='roles')
    `;
    return await database.get(sqlQuery, async (err, row)=>{
        if(err){
            console.log(err.message);
        } else {
            if(row === undefined){
                return;
            }
            if(row['count(*)'] === 3){
                console.log('Database is valid');
                return;
            } else {
                console.log('Database invalid. Trying to repair now.');
                return await createDatabase();
            }
        }
    });
}
exports.checkDatabase = checkDatabase;

/*
function addQuote(user, quote, isAdmin)
    opens a database connection and sends the "quote" (by "user"). If isAdmin is false, won't add the quote
parameters:
    user : string, username
    quote: string
    isAdmin: boolean
returns:
    database object for chaining
*/
async function addQuote(user, quote, isAdmin){
    if(isAdmin !== undefined & !isAdmin){
        console.log('Non admin user tried to add a quote');
        return;
    }
    var database =  new sqlite.Database(quotedb, sqlite.OPEN_READWRITE, (err) => {
      if(err){
        console.log(err);
      }
    });
    console.log("userexists")
    await userExistsInDB(database, user)
        .then((result)=>{
            if(result===false){
                createUserInDB(database, user)
                    .catch((err)=>{
                        console.log(err);
                    });
            }
            let findUserQuery = `
            SELECT id FROM users WHERE name = ?
            `;
            database.get(findUserQuery, user, async (err, row) => {
                if(err){
                    console.log(err);
                    return;
                }
                if(row === undefined){
                    return;
                }
                let timestamp = new Date().getTime()
                let sqlQuery  = `
                INSERT INTO quotes (
                    userid,
                    quote,
                    date
                ) VALUES (
                    ?,
                    ?,
                    ?
                )
                `;
                database = database.run(sqlQuery, [row["id"], quote, timestamp],(err)=>{
                    if(err){
                        console.log(err + ' : could not add quote to database');
                        return;
                    } else {
                        console.log('Quote successfully added !');
                        return;
                    }
                });
            });
        })
        .catch((err)=>{
            console.log(err);
        });
    return database;
}
exports.addQuote = addQuote;

/*
function userExistsInDB(database, username)
    check if username exists in the table users of database "database"
parameters:
    database : database object
    userame : string
*/
async function userExistsInDB(database, username){
    var bFlag = false;
    let sqlQuery = `
        SELECT count(*) FROM users WHERE name = ?
    `;
    console.log(sqlQuery);
    return await new Promise(function (resolve, reject){
        database.get(sqlQuery, username,(err, row)=>{
            if(err){
                reject(err);
                return;
            }
            else{
                if(row === undefined){
                    return;
                }
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

/*
beurk
*/
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
            ?,
            ?
        )
    `;
    return await new Promise( function(resolve, reject) {
        database.run(sqlQuery,[user, roleId],(err)=>{
            if(err){
                reject(err);
                return;
            }
        });
    });
}

function getNbQuotes(database){
    let sqlQuery = `
        SELECT count(*) FROM quotes
    `
    return new Promise(function (resolve, reject){
        database.get(sqlQuery, (err, row) => {
            if(err){
                reject(err);
                return;
            }
            resolve(row);
            return;
        });
    });
}
exports.getNbQuotes = getNbQuotes;

/*
function getQuoteById(database, quoteid)
    fetches a row from database.quotes
parameters:
    database : SQLITE3 database object
    quoteid : int - quote row id
returns:
    Promise, which resolves a row object
*/
function getQuoteById(database, quoteid){
    let sqlQuery = `
        SELECT * from quotes WHERE id = ?
    `
    var userid;
    var resultQuote = new Promise(async function (resolve, reject){
        await database.get(sqlQuery, quoteid, (err, row) => {
            if(err){
                reject(err);    
                return;
            }
            if(row === undefined){
                reject("Result returned no rows");
                return;
            }
            resolve(row);
            return;
        });
    });    
    return resultQuote;
}
exports.getQuoteById = getQuoteById

function formatQuote(database, result){
    var result_func = new Promise(async function (resolve, reject){
        let sqlGetUsername = `
            SELECT name FROM users WHERE id = ?
        `
        await database.get(sqlGetUsername, result["userid"], (err, row_username) => {
        if(err){
            reject(err);
            return;
        }
        if(row_username === undefined){
            reject("Userid not found");
            return;
        }
        console.log(result["id"])
        console.log(result)
        result["date"] = new Date(result["date"]);
        resolve(`Quote n°${result['id']} : "${result["quote"]}" - ${row_username["name"]}, ${result["date"].getDate()}/${result["date"].getMonth()}/${result["date"].getFullYear()}`);
        return;
        });
    });
    return result_func;
}
exports.formatQuote = formatQuote