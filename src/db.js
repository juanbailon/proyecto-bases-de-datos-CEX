const {Pool} = require('pg');

//conecxion a la base de datos
const pool = new Pool( {
    user: 'postgres',
    password: 'pg123',
    host: 'localhost',
    port: 5432,
    database: 'crypto_exchange'
} );

module.exports = pool;