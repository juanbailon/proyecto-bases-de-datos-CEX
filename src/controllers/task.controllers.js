const pool = require('../db');
const {  create_basic_coin_exchange, create_basic_order, make_basic_order_limit, add_limit_order_to_books, determine_order_side, modify_user_balance_to_create_order } = require('../components/orders');
const { macth_limit_order, execute_market_order } = require('../components/match_engine');


const getLogin = (req, res, next) => {
    try {
        res.sendFile('/home/juan/cosasMias/proyecto BD/B-exchange/login.html');

    } catch (error) {
        next(error);
    }
};


const signIn = async (req, res, next) => {

    const {email, password } = req.body;

    try {
        const result = await pool.query('SELECT email, password FROM users WHERE email= $1 AND password= $2', [email, password]);
    
        console.log(result);
        if(result.rowCount == 0){
            res.json({ message: "login fail, the follow credentials are wront", credentials: {'email': email, 'password': password} });
        }
        else{
            res.json({ message: "login succesful"});
        }

    } catch (error) {
        next(error);
    }
};


const getSignUpPage = (req, res, next) => {
    try {
        res.sendFile('/home/juan/cosasMias/proyecto BD/B-exchange/signUp.html');

    } catch (error) {
        next(error);
    }
};


const createNewUser = async (req, res, next) => {

    const {email, password } = req.body;

    try {
        const result = await pool.query('INSERT INTO users(email, password) VALUES ($1, $2) RETURNING *',
                                       [email, password]);
    
        console.log(result);
        res.json(result.rows[0]);

    } catch (error) {
        next(error);
    }
};


const getTrade = (req, res, next) => {
    try {
        res.sendFile('/home/juan/cosasMias/proyecto BD/B-exchange/spot-trading.html');

    } catch (error) {
        next(error);
    }
};


const trade_limit = async (req, res, next) => {

    const {userId, input_coin, output_coin, input_amount, /* output_amount, */ price, exchange_pair, order_type} = req.body;  //input_amount = amount
    let fee = 1; //this is 1%

    try {

        const q0 = `SELECT total, available, in_orders FROM user_coins WHERE user_id = $1 AND ticker_symbol = $2`;
        const result0 = await pool.query( q0, [userId, input_coin] );

        if( result0.rowCount == 0 ){
            res.json({message: `insufficient funds`, available_funds: 0});
        }
        else if( result0.rows[0].available < input_amount ){
            res.json({message: `insufficient funds`, available_funds: result0.rows[0].available });
        }
        else{            

            const q1 = `INSERT INTO coin_exchange (user_id, input_coin, output_coin, input_amount, fee_percentage) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
            const result = await pool.query( q1, [  userId, 
                                                    input_coin,
                                                    output_coin,
                                                    input_amount,                                                
                                                    fee ] );

            let transaction_id = result.rows[0].transaction_id;

            const q2 = `SELECT order_book_id FROM order_book WHERE exchange_pair = $1`;
            const result2 = await pool.query( q2, [exchange_pair]);
            
            let order_book_id = result2.rows[0].order_book_id;

            const q3 = `INSERT INTO orders (transaction_id, order_type, order_book_id ) VALUES ($1, $2, $3 ) RETURNING *` ;
            const result3 = await pool.query( q3, [ transaction_id,
                                                    order_type,
                                                    order_book_id ] );

            
            let order_id = result3.rows[0].order_id;
            
            determine_order_side(order_id, input_coin, output_coin, order_book_id); 

            modify_user_balance_to_create_order( userId, input_coin, input_amount, result0.rows[0].available, result0.rows[0].in_orders);

            if(order_type == "limit"){

                const q6 = `SELECT side FROM orders WHERE order_id = $1`;
                const result6 = await pool.query( q6, [ order_id ] );

                let output_amount = ( result6.rows[0].side=='sell' )? input_amount*price : input_amount/price;
                output_amount = output_amount.toFixed(8);

                const q4 = `UPDATE coin_exchange SET output_amount = $1 WHERE transaction_id = $2`;
                const result4 = await pool.query( q4, [ output_amount, transaction_id] );

                const q5 = `UPDATE orders SET execution_price = $1, status = $2 WHERE order_id = $3`;
                const result5 = await pool.query( q5, [ price, 'open',order_id] ); 
                
                add_limit_order_to_books(order_id, order_book_id);

                res.json({message: `limit order created sucesfully`});
            }
            else if (order_type == "market") {

                execute_market_order( userId, order_id, transaction_id, input_coin, output_coin, input_amount, order_book_id );
                res.json({message: "market order created sucesfully"});

                
            }     


            // res.json(result.rows[0]);
            // res.json(result2.rows[0]);
            // res.json(result3.rows[0]);
            // res.json(result4.rows[0]);
            // res.json(result5.rows[0]);

        }


    } catch (error) {
        next(error);
    }
};


const provideLiquidity = async (req, res, next) => {

    const { userId, coin_1, coin_2, amount_coin_1, amount_coin_2, exchange_pair } = req.body;
    
    try {

        const q0 = `SELECT total, available, in_liq_pools FROM user_coins WHERE user_id = $1 AND ticker_symbol = $2`;
        const result0 = await pool.query( q0, [userId, coin_1] );

        const q0_1 = `SELECT total, available, in_liq_pools FROM user_coins WHERE user_id = $1 AND ticker_symbol = $2`;
        const result0_1 = await pool.query( q0_1, [userId, coin_2] );

        if( result0.rowCount == 0 || result0_1.rowCount == 0 ){
            res.json({message: `insufficient funds`});
        }
        else if( result0.rows[0].available < parseInt(amount_coin_1)  || result0_1.rows[0].available < parseInt(amount_coin_2) ){
            res.json( {  message: `insufficient funds`,
                        available_funds_coin_1: result0.rows[0].available,
                        available_funds_coin_2: result0_1.rows[0].available 
                    });
        }
        else{

            const q1 = `SELECT liquidity_pool_id FROM liquidity_pools WHERE exchange_pair = $1`;
            const result1 = await pool.query( q1, [exchange_pair] );
            
            let liq_pool_id = result1.rows[0].liquidity_pool_id;

            const q1_2 = `SELECT * FROM liquidity_providers WHERE user_id = $1 AND liquidity_pool_id = $2`;
            const result1_2 = await pool.query( q1_2, [userId, liq_pool_id] );

            
            if ( result1_2.rowCount == 0 ) {
                
                const q2 = `INSERT INTO liquidity_providers (user_id, amount_coin_1, amount_coin_2, liquidity_pool_id) VALUES($1, $2, $3, $4)`;
                const result2 = await pool.query( q2, [userId,
                                                        amount_coin_1,
                                                        amount_coin_2,
                                                        liq_pool_id] );

                const q3 = `SELECT amount_coin_1, amount_coin_2 FROM liquidity_pools WHERE liquidity_pool_id = $1`;
                const result3 = await pool.query( q3, [ liq_pool_id ] );
                
                let new_amount_coin_1 = result3.rows[0].amount_coin_1 + parseInt(amount_coin_1);
                let new_amount_coin_2 = result3.rows[0].amount_coin_2 + parseInt(amount_coin_2);


                const q4 = `UPDATE liquidity_pools SET  amount_coin_1 = $1, amount_coin_2 = $2 WHERE liquidity_pool_id = $3`;
                const result4 = await pool.query( q4, [ new_amount_coin_1, new_amount_coin_2, liq_pool_id] );

                const q5 = `UPDATE user_coins SET available = $1, in_liq_pools = $2 WHERE user_id = $3 AND ticker_symbol= $4`;

                let new_available = result0.rows[0].available - parseFloat(amount_coin_1);
                let new_in_liq_pools = result0.rows[0].in_liq_pools + parseFloat(amount_coin_1);
                const result5 = await pool.query( q5, [ new_available, new_in_liq_pools, userId, coin_1 ] );

                new_available = result0_1.rows[0].available - parseFloat(amount_coin_2);
                new_in_liq_pools = result0_1.rows[0].in_liq_pools + parseFloat(amount_coin_2);
                const result5_1 = await pool.query( q5, [ new_available, new_in_liq_pools, userId, coin_2 ] );


                res.json({message: `liquidity added sucessfully to pool ${exchange_pair}, new liq_provider created`});

            }
            else{

                res.json({message: `to add liq on top of added liq not done yeah`});

            }
            

        }

    } catch (error) {
        //next(error);
        console.log(error)
    }
};



//************************ */

const getAllTask = async (req, res, next) => {
    try {
        const allTask = await pool.query('SELECT * FROM users');
    
        // console.log(allTask);
        // res.send('tareas');
        res.json(allTask.rows);
    } catch (error) {
        next(error);
    }
};

/* const hello = (req, res, next) => {
    res.send('hello world');
}; */

const getTask = async (req, res, next) => {
    try {
        //console.log(req.params.id);
        const {id} = req.params;

        const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [id]);
        //console.log(result);
        if (result.rows.length == 0) {
            return res.status(404).json( {message: "user not found"} );
        }

        res.json(result.rows[0]);

    } catch (error) {
        next(error);
    }
};

const createTask = async (req, res, next) => {
    // const task = req.body;
    const {email, password } = req.body;

    try {
        const result = await pool.query('INSERT INTO users(email, password) VALUES ($1, $2) RETURNING *',
                                       [email, password]);
    
        console.log(result);
        res.json(result.rows[0]);

    } catch (error) {
        next(error);
    }

};

const deleteTask =  async (req, res, next) => {
    
    try {
        const {id} = req.params;
    
        const result = await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
        
        if (result.rowCount ==0 ) {
            return res.status(404).json( {message: "user not found"} );
        }

        return res.sendStatus(204);

    } catch (error) {
        next(error);        
    }
}; 


const updateTask = async (req, res, next) => {

    try {
        const {id} = req.params;
        const {email, password} = req.body;

        const result = await pool.query(
            'UPDATE users SET password= $1 WHERE user_id= $2 RETURNING *',
            [password, id])

        if (result.rows.length == 0) {
            return res.status(404).json( {message: "user not found"} );
        }

        return res.json(result.rows[0]);
        
    } catch (error) {
        next(error);    
    }
};


module.exports = {
    getLogin,
    signIn,
    createNewUser,
    getSignUpPage,
    getTrade,
    trade_limit,
    provideLiquidity,

    getAllTask, // es igual a getAllTask: getAllTask
    //hello,
    getTask,
    createTask,
    deleteTask,
    updateTask
};