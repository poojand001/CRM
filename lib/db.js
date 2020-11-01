//Connecting the MySQL database
const mysql = require('mysql');

const connection = mysql.createConnection({
    host: 'localhost',
    user: '***',
    database: 'crm',
    password: '********'
});

connection.connect();
module.exports = connection;