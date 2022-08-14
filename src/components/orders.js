const pool = require('../db');


async function add_limit_order_to_books(order_id,  order_book_id){

    try {

        const q0 = `SELECT side FROM orders WHERE order_id = $1`;
        result0 = await pool.query( q0, [order_id] );
        
        let side = result0.rows[0].side;
        
        let q4, result4;

        if( side == 'sell'){ 

            q4 = `INSERT INTO ask_book(ask_book_id, order_book_id, order_id) VALUES( $1, $2, $3 ) RETURNING *`; 
            result4 = await pool.query( q4, [ order_book_id ,
                                                order_book_id,
                                                order_id ] );
                                                         
        }
        else if( side == 'buy'){


            q4 = `INSERT INTO bid_book(bid_book_id, order_book_id, order_id) VALUES( $1, $2, $3 ) RETURNING *`; 
            result4 = await pool.query( q4, [ order_book_id ,
                                                order_book_id,
                                                order_id  ] );
                                                          
        }
        else{
            throw new Error('input or output coins in the order DONT macht any order book exchange pair');
        }
        
    } catch (error) {
        console.log(error);
    }

}


async function modify_user_balance_to_create_order( userId, input_coin, input_amount, available, in_orders){

    const q6 = `UPDATE user_coins SET available = $1, in_orders = $2 WHERE user_id = $3 AND ticker_symbol= $4`;
   
    let new_available = available - input_amount;
    let new_in_orders = in_orders + parseFloat(input_amount);   

    const result6 = await pool.query( q6, [ new_available, new_in_orders, userId, input_coin] );
}


async function determine_order_side(order_id, input_coin, output_coin, order_book_id){

    const q3 = `SELECT exchange_pair, coin_1, coin_2 FROM order_book WHERE order_book_id = $1`; 
    const result3 = await pool.query( q3, [order_book_id] );
    
    let order_book_coin_1 = result3.rows[0].coin_1;
    let order_book_coin_2 = result3.rows[0].coin_2;

    const q5 = `UPDATE orders SET side = $1 WHERE order_id = $2`; 
    let result5;

    if( input_coin==order_book_coin_1 && output_coin==order_book_coin_2 ){ 

        result5 = await pool.query( q5, [ 'sell', order_id ] );                                                     
    }
    else if( input_coin==order_book_coin_2 && output_coin==order_book_coin_1 ){
       
        result5 = await pool.query( q5, [ 'buy', order_id ] );                                                    
    }
    else{
        throw new Error('input or output coins in the order DONT macht any order book exchange pair');
    }

}


async function modify_user_funds(user_id, ticker_symbol, amount, operation='add', modify_available=false, modify_in_orders=false, modify_in_liq_pools=false ){

    const q1 = `SELECT id, user_id, total, available, in_orders, in_liq_pools FROM user_coins WHERE user_id = $1 AND ticker_symbol = $2`;
    let result1 = await pool.query( q1, [ user_id, ticker_symbol ] );


    if ( result1.rowCount == 0 ) {

        const q2 = `INSERT INTO user_coins (user_id, ticker_symbol, total, available, in_orders, in_liq_pools) VALUES ($1, $2, $3, $4, $5, $6)`;
        const result2 = await pool.query( q2, [ user_id, ticker_symbol, 0, 0, 0, 0 ] );

        result1 = await pool.query( q1, [ user_id, ticker_symbol ] );
    }
    

    const q3 = `UPDATE user_coins SET total = $1, available = $2, in_orders = $3, in_liq_pools = $4 WHERE id = $5`;
    
    let new_total, new_available, new_in_orders, new_in_liq_pools; 

    if( operation == 'add' ){

        new_total = result1.rows[0].total + amount;

        new_available = ( modify_available==true )? result1.rows[0].available + amount : result1.rows[0].available ;

        new_in_orders = ( modify_in_orders==true )? result1.rows[0].in_orders + amount : result1.rows[0].in_orders ;

        new_in_liq_pools = ( modify_in_liq_pools==true )? result1.rows[0].in_liq_pools + amount : result1.rows[0].in_liq_pools ;

        const result3 = await pool.query( q3, [ new_total, new_available, new_in_orders, new_in_liq_pools, result1.rows[0].id ] );
    }
    else if( operation == 'subtract' || operation == 'sub' ){

        new_total = result1.rows[0].total - amount;

        new_available = ( modify_available==true )? result1.rows[0].available - amount : result1.rows[0].available ;

        new_in_orders = ( modify_in_orders==true )? result1.rows[0].in_orders - amount : result1.rows[0].in_orders ;

        new_in_liq_pools = ( modify_in_liq_pools==true )? result1.rows[0].in_liq_pools - amount : result1.rows[0].in_liq_pools ;

        const result3 = await pool.query( q3, [ new_total, new_available, new_in_orders, new_in_liq_pools, result1.rows[0].id ] );
    }

}



module.exports = {
    add_limit_order_to_books,
    determine_order_side,
    modify_user_balance_to_create_order,
    modify_user_funds

};