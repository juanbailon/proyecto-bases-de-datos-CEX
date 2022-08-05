const pool = require('../db');

async function add_limit_order_to_books(order_id){

    try {

        const q1 = `SELECT input_coin, output_coin FROM coin_exchange WHERE transaction_id IN (SELECT transaction_id FROM orders WHERE order_id = $1 )`;
        const result = await pool.query( q1, [order_id] );

        const q2 = `SELECT order_book_id FROM orders WHERE order_id = $1`;
        const result2 = await pool.query( q2, [order_id] );

        let input_coin = result.rows[0].input_coin;
        let output_coin = result.rows[0].output_coin;
        let order_book_id = result2.rows[0].order_book_id;

        
        const q3 = `SELECT exchange_pair, coin_1, coin_2 FROM order_book WHERE order_book_id = $1`; 
        const result3 = await pool.query( q3, [order_book_id] );
        
        let exchange_pair = result3.rows[0].exchange_pair;
        let order_book_coin_1 = result3.rows[0].coin_1;
        let order_book_coin_2 = result3.rows[0].coin_2;
        
        //console.log("inputCoin: ", typeof(order_book_coin_1), " ", order_book_coin_1);
        
        let q4, result4;
        const q5 = `UPDATE orders SET side = $1 WHERE order_id = $2`; 
        let result5;

        if( input_coin==order_book_coin_1 && output_coin==order_book_coin_2 ){ 

            q4 = `INSERT INTO ask_book(ask_book_id, order_book_id, order_id) VALUES( $1, $2, $3 ) RETURNING *`; 
            result4 = await pool.query( q4, [ order_book_id ,
                                                order_book_id,
                                                order_id ] );
  
            result5 = await pool.query( q5, [ 'sell', order_id ] );
                                                         
        }
        else if( input_coin==order_book_coin_2 && output_coin==order_book_coin_1 ){

            q4 = `INSERT INTO bid_book(bid_book_id, order_book_id, order_id) VALUES( $1, $2, $3 ) RETURNING *`; 
            result4 = await pool.query( q4, [ order_book_id ,
                                                order_book_id,
                                                order_id  ] );
           
            result5 = await pool.query( q5, [ 'buy', order_id ] );                                                    
        }
        else{
            throw new Error('input or output coins in the order DONT macht any order book exchange pair');
        }
        
    } catch (error) {
        console.log(error);
    }

}


function modify_user_balance(user_id){
    
}



module.exports = {
    add_limit_order_to_books
};