const pool = require('../db');
const { modify_user_funds } = require('./orders');

async function macth_limit_order(order_id, ){

    const q2 = `SELECT order_book_id FROM orders WHERE order_id = $1`;
    const result2 = await pool.query( q2, [order_id] );

}


async function execute_market_order(user_id, order_id, transaction_id, input_coin, output_coin, input_amount, order_book_id){

    console.log("calicho 1")

    const q0 = `SELECT side FROM orders WHERE order_id= $1` ;
    const result0 = await pool.query( q0, [order_id] );

    const side = result0.rows[0].side;

    const q20 =  `SELECT coin_exchange.user_id, orders.order_id, orders.transaction_id, orders.order_type, coin_exchange.input_coin, coin_exchange.output_coin, coin_exchange.input_amount, coin_exchange.output_amount, orders.execution_price FROM ` +
                        `(orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) `  +
                            `WHERE orders.order_book_id = $1 AND orders.order_type = $2 AND orders.side = $3 AND status!= 'close'` +
                                `ORDER BY orders.execution_price DESC` ;


    //sell
    // if( side == 'sell' ){ 

        console.log("calicho 2")

        let result2, q2;

        if( side == 'sell' ){
            q2 =  `SELECT coin_exchange.user_id, orders.order_id, orders.transaction_id, orders.order_type, coin_exchange.input_coin, coin_exchange.output_coin, coin_exchange.input_amount, coin_exchange.output_amount, orders.execution_price FROM ` +
                        `(orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) `  +
                            `WHERE orders.order_book_id = $1 AND orders.order_type = $2 AND orders.side = $3 AND status!= 'close' AND coin_exchange.user_id != $4` +
                                `ORDER BY orders.execution_price DESC` ;

            result2 = await pool.query( q2, [order_book_id, 'limit', 'buy', user_id] );
        }
        else if( side == "buy"){

            q2 =  `SELECT coin_exchange.user_id, orders.order_id, orders.transaction_id, orders.order_type, coin_exchange.input_coin, coin_exchange.output_coin, coin_exchange.input_amount, coin_exchange.output_amount, orders.execution_price FROM ` +
                        `(orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) `  +
                            `WHERE orders.order_book_id = $1 AND orders.order_type = $2 AND orders.side = $3 AND status!= 'close' AND coin_exchange.user_id != $4` +
                                `ORDER BY orders.execution_price ASC` ;

            result2 = await pool.query( q2, [order_book_id, 'limit', 'sell', user_id] );

        }

        const useful_orders_in_bid_book =  result2.rows;

        console.log(useful_orders_in_bid_book)    

        let sum = 0;
        let counter =0;
        
        while( sum < input_amount ){
            sum += result2.rows[counter].output_amount;
            counter++;
            //console.log(sum)
        }

        console.log(sum)
        console.log(counter)
        console.log(input_amount)

        if( sum==input_amount && counter==1 ){

            console.log("calicho 3")

            let order_id_1 = order_id;

            const exec_price = useful_orders_in_bid_book[0].execution_price;
            const order_id_2 = useful_orders_in_bid_book[0].order_id

            create_trade(order_id, exec_price, order_id_2);

            
            const q1 = `UPDATE orders SET close_date = NOW(), status = 'close' WHERE order_id = $1`;
            const result1 = await pool.query( q1, [ order_id_1 ] );
            const result1_2 = await pool.query( q1, [ order_id_2 ] );

            let transac_id_1 = transaction_id;
            let transac_id_2 = useful_orders_in_bid_book[0].transaction_id;

            //*********** */
    
            let user_id_1 = user_id;
            let user_id_2 = useful_orders_in_bid_book[0].user_id;
            
            const q4 = `UPDATE coin_exchange SET output_amount = $1 WHERE transaction_id = $2`;
            const result4 = await pool.query( q4, [ useful_orders_in_bid_book[0].input_amount, transac_id_1 ] ); 

            

            modify_user_funds(user_id_1, input_coin, input_amount, 'sub', false, true);
            modify_user_funds(user_id_1, output_coin, useful_orders_in_bid_book[0].input_amount, 'add', true);

            modify_user_funds(user_id_2, useful_orders_in_bid_book[0].input_coin, useful_orders_in_bid_book[0].input_amount, 'sub', false, true);
            modify_user_funds(user_id_2, useful_orders_in_bid_book[0].output_coin, input_amount, 'add', true);
            
        }

    // }
    //buy
    // else if( side=='buy' ){

                                                        
    // }

}


async function create_trade(order_id_1, execution_price, order_id_2){

    const q1 = `INSERT INTO trades (order_id_1, execution_price, order_id_2 ) VALUES ($1, $2, $3) RETURNING *` ;
    const result1 = await pool.query( q1, [ order_id_1, execution_price, order_id_2 ] );    
}


async function execute_exactly_matching_trade_market(order_id_1, order_id_2){

    const q1 = `UPDATE orders SET close_date = NOW(), status = 'close' WHERE order_id = $1`;
    const result1 = await pool.query( q1, [ order_id_1 ] );
    const result1_2 = await pool.query( q1, [ order_id_2 ] );

    const q2 = `SELECT transaction_id, order_type  FROM orders WHERE order_id = $1 `;
    const result2 = await pool.query( q2, [ order_id_1 ] );
    const result2_2 = await pool.query( q2, [ order_id_2 ] );

    let transac_id_1 = result2.rows[0].transaction_id;
    let transac_id_2 = result2_2.rows[0].transaction_id;

    let order_type_1 = result2.rows[0].order_type;
    let order_type_2 = result2_2.rows[0].order_type; //this one is always limit

    

        const q3 = `SELECT input_amount, user_id, input_coin, output_coin FROM coin_exchange WHERE transaction_id = $1`;
        const result3 = await pool.query( q3, [ transac_id_1 ] );
        const result3_2 = await pool.query( q3, [ transac_id_2 ] );

        let user_id_1 = result3.rows[0].user_id;
        let user_id_2 = result3_2.rows[0].user_id;
        
        const q4 = `UPDATE coin_exchange SET output_amount = $1 WHERE transaction_id = $2`;
        const result4 = await pool.query( q4, [ result3_2.rows[0].input_amount, transac_id_1 ] );       

        modify_user_funds(user_id_1, result3.rows[0].output_coin, )

    



}



function limit_order_totally_completed(){

}

function limit_order_partially_completed(){

}

function exchange_funds_between_traders( trader1_order_id, trader2_order_id ){

}



module.exports = {
    macth_limit_order,
    execute_market_order
};