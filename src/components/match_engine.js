const pool = require('../db');

async function macth_limit_order(order_id, ){

    const q2 = `SELECT order_book_id FROM orders WHERE order_id = $1`;
    const result2 = await pool.query( q2, [order_id] );

}


async function execute_market_order(order_id, input_coin, output_coin, input_amount, order_book_id){

    const q1 = `SELECT exchange_pair, coin_1, coin_2 FROM order_book WHERE order_book_id = $1`; 
    const result1 = await pool.query( q1, [order_book_id] );
    
    let exchange_pair = result1.rows[0].exchange_pair;
    let order_book_coin_1 = result1.rows[0].coin_1;
    let order_book_coin_2 = result1.rows[0].coin_2;

    //sell
    if( input_coin==order_book_coin_1 && output_coin==order_book_coin_2 ){ 

        const q2 = `SELECT orders.order_id, orders.transaction_id, coin_exchange.input_amount FROM ` + 
                        '( (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) ' + 
                            'INNER JOIN bid_book ON orders.order_id = bid_book.order_id ) ' +
                                'ORDER BY coin_exchange.input_amount ASC';

        const result2 = await pool.query( q2 );

        console.log(result2)    

        let sum = 0;
        let counter =0;
        
        while( sum < input_amount ){
            sum += result2.rows[counter].input_amount;
            counter++;
            //console.log(sum)
        }

        //console.log(counter, " ;; ", sum)

        /* while(){

        } */

    }
    //buy
    else if( input_coin==order_book_coin_2 && output_coin==order_book_coin_1 ){

        q4 = `INSERT INTO bid_book(bid_book_id, order_book_id, order_id) VALUES( $1, $2, $3 ) RETURNING *`; 
        result4 = await pool.query( q4, [ order_book_id ,
                                            order_book_id,
                                            order_id  ] );
       
        result5 = await pool.query( q5, [ 'buy', order_id ] );                                                    
    }


}



module.exports = {
    macth_limit_order,
    execute_market_order
};