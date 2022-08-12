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
            console.log(result2.rows[counter].output_amount);
            sum += result2.rows[counter].output_amount;
            counter++;
            console.log(sum, " &&&&&&&&&&&&&&&&&&&")
        }

        console.log(sum)
        console.log(counter)
        console.log(input_amount)

        if( sum==input_amount && counter==1 ){

            macht_orders(user_id, order_id, transaction_id, input_coin, output_coin, input_amount, useful_orders_in_bid_book);

        }
        else if( sum==input_amount ){

            macht_orders_2(user_id, order_id, transaction_id, input_coin, output_coin, input_amount, useful_orders_in_bid_book, counter, sum);
            
        }

}


async function create_trade(order_id_1, execution_price, order_id_2){

    const q1 = `INSERT INTO trades (order_id_1, execution_price, order_id_2 ) VALUES ($1, $2, $3) RETURNING *` ;
    const result1 = await pool.query( q1, [ order_id_1, execution_price, order_id_2 ] );    
}


async function macht_orders(user_id, order_id, transaction_id, input_coin, output_coin, input_amount, useful_orders_in_book){

    console.log("calicho 3")

    let order_id_1 = order_id;

    const exec_price = useful_orders_in_book[0].execution_price;
    const order_id_2 = useful_orders_in_book[0].order_id

    create_trade(order_id, exec_price, order_id_2);

    
    const q1 = `UPDATE orders SET close_date = NOW(), status = 'close' WHERE order_id = $1`;
    const result1 = await pool.query( q1, [ order_id_1 ] );
    const result1_2 = await pool.query( q1, [ order_id_2 ] );

    let transac_id_1 = transaction_id;
    let transac_id_2 = useful_orders_in_book[0].transaction_id;

    //*********** */

    let user_id_1 = user_id;
    let user_id_2 = useful_orders_in_book[0].user_id;
    
    const q4 = `UPDATE coin_exchange SET output_amount = $1 WHERE transaction_id = $2`;
    const result4 = await pool.query( q4, [ useful_orders_in_book[0].input_amount, transac_id_1 ] ); 

    
    modify_user_funds(user_id_1, input_coin, input_amount, 'sub', false, true);
    modify_user_funds(user_id_1, output_coin, useful_orders_in_book[0].input_amount, 'add', true);

    modify_user_funds(user_id_2, useful_orders_in_book[0].input_coin, useful_orders_in_book[0].input_amount, 'sub', false, true);
    modify_user_funds(user_id_2, useful_orders_in_book[0].output_coin, input_amount, 'add', true);    

}


async function macht_orders_2(user_id, order_id, transaction_id, input_coin, output_coin, input_amount, useful_orders_in_book, counter, sum){

    const q1 = `UPDATE orders SET close_date = NOW(), status = 'close' WHERE order_id = $1`;
    let temp = 0;
    
    for(let index=0; index<counter; index++) {

    console.log("calicho 3  ", index)

    let order_id_1 = order_id;

    const exec_price = useful_orders_in_book[index].execution_price;
    const order_id_2 = useful_orders_in_book[index].order_id

    create_trade(order_id, exec_price, order_id_2);

    
    //const q1 = `UPDATE orders SET close_date = NOW(), status = 'close' WHERE order_id = $1`;
    // const result1 = await pool.query( q1, [ order_id_1 ] );
    const result1_2 = await pool.query( q1, [ order_id_2 ] );

    let transac_id_1 = transaction_id;
    let transac_id_2 = useful_orders_in_book[index].transaction_id;

    //*********** */

    let user_id_1 = user_id;
    let user_id_2 = useful_orders_in_book[index].user_id;
    
     const q4 = `UPDATE coin_exchange SET output_amount = $1 WHERE transaction_id = $2`;
     const q5 = `SELECT output_amount FROM coin_exchange WHERE transaction_id = $1`;

     const result5 = await pool.query( q5, [ transac_id_2 ] ); 
     //temp = result5.rows[0].output_amount;
     console.log(temp, "   jose");
     temp = temp + useful_orders_in_book[index].input_amount;
     console.log(temp, "   jose 2");

     const result4 = await pool.query( q4, [ temp, transac_id_1 ] ); 
    
    console.log('paul');
    modify_user_funds(user_id_1, input_coin, useful_orders_in_book[index].output_amount, 'sub', false, true);
    console.log('paul 2');
    modify_user_funds(user_id_1, output_coin, useful_orders_in_book[index].input_amount, 'add', true);
    
    console.log('paul 3');
    modify_user_funds(user_id_2, useful_orders_in_book[index].input_coin, useful_orders_in_book[index].input_amount, 'sub', false, true);
    console.log('paul 4');
    modify_user_funds(user_id_2, useful_orders_in_book[index].output_coin, useful_orders_in_book[index].output_amount, 'add', true);    

    }

    const result1 = await pool.query( q1, [ order_id ] );

}


async function macht_orders_3(user_id, order_id, transaction_id, input_coin, output_coin, input_amount, useful_orders_in_book, index){

    console.log("calicho 3")

    let order_id_1 = order_id;

    const exec_price = useful_orders_in_book[index].execution_price;
    const order_id_2 = useful_orders_in_book[index].order_id

    create_trade(order_id, exec_price, order_id_2);

    
    const q1 = `UPDATE orders SET close_date = NOW(), status = $1 WHERE order_id = $2`;
    const result1 = await pool.query( q1, [ 'close', order_id_1 ] );
    const result1_2 = await pool.query( q1, [ 'parcial', order_id_2 ] );

    let transac_id_1 = transaction_id;
    let transac_id_2 = useful_orders_in_book[index].transaction_id;

    //*********** */

    let user_id_1 = user_id;
    let user_id_2 = useful_orders_in_book[index].user_id;
    
    const q4 = `UPDATE coin_exchange SET output_amount = $1 WHERE transaction_id = $2`;
    const q5 = `SELECT output_amount FROM coin_exchange WHERE transaction_id = $1`;

    const result5 = await pool.query( q5, [ transac_id_2 ] );

    let temp = result5.rows[0].output_amount;
    temp = temp + useful_orders_in_book[index].input_amount;

    const result4 = await pool.query( q4, [ useful_orders_in_book[index].input_amount, transac_id_1 ] ); 

    
    modify_user_funds(user_id_1, input_coin, useful_orders_in_book[index].output_amount, 'sub', false, true);
    modify_user_funds(user_id_1, output_coin, useful_orders_in_book[index].input_amount, 'add', true);

    modify_user_funds(user_id_2, useful_orders_in_book[index].input_coin, useful_orders_in_book[index].input_amount, 'sub', false, true);
    modify_user_funds(user_id_2, useful_orders_in_book[index].output_coin, useful_orders_in_book[index].output_amount, 'add', true);    

}


async function execute_limit_order(user_id, order_id, transaction_id, input_coin, output_coin, input_amount, output_amount, execution_price, order_book_id){

    console.log("calicho 1 limit")

    const q0 = `SELECT side FROM orders WHERE order_id= $1` ;
    const result0 = await pool.query( q0, [order_id] );

    const side = result0.rows[0].side;

        console.log("calicho 2")

        let result2, result3, q2, q3;

        q2 = `SELECT coin_exchange.user_id, orders.order_id, orders.transaction_id, orders.creation_date, orders.order_type, coin_exchange.input_coin, coin_exchange.output_coin, coin_exchange.input_amount, coin_exchange.output_amount, orders.execution_price FROM ` +
         `      (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) ` +
                    `WHERE orders.order_book_id = $1 AND orders.order_type = $2 AND orders.side = $3 AND status!= 'close' AND coin_exchange.user_id != $4 AND orders.execution_price = $5 ` +
                        `ORDER BY orders.creation_date ASC` ; 


        q3 = `SELECT coin_exchange.user_id, orders.order_id, orders.transaction_id, orders.creation_date, orders.order_type, coin_exchange.input_coin, coin_exchange.output_coin, coin_exchange.input_amount, coin_exchange.output_amount, orders.execution_price FROM ` +
        `      (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) ` +
                    `WHERE orders.order_book_id = $1 AND orders.order_type = $2 AND orders.side = $3 AND status!= 'close' AND coin_exchange.user_id != $4 AND orders.execution_price = $5 AND coin_exchange.output_amount = $6 ` +
                        `ORDER BY orders.creation_date ASC` ; 

                        

        if( side == 'sell' ){
        
            result2 = await pool.query( q2, [order_book_id, 'limit', 'buy', user_id, execution_price] );

            result3 = await pool.query( q3, [order_book_id, 'limit', 'buy', user_id, execution_price, input_amount] );
        }
        else if( side == "buy"){

            result2 = await pool.query( q2, [order_book_id, 'limit', 'sell', user_id, execution_price] );

            result3 = await pool.query( q3, [order_book_id, 'limit', 'sell', user_id, execution_price, input_amount] );
        }


        let  useful_orders_in_bid_book;

        if( result3.rowCount > 0 ){

            useful_orders_in_bid_book =  result3.rows;

            macht_orders(user_id, order_id, transaction_id, input_coin, output_coin, input_amount, useful_orders_in_bid_book);

            return 0;
        }

        useful_orders_in_bid_book =  result2.rows;

        if( result2.rowCount == 0 ){
            return 0;
        }

        console.log(useful_orders_in_bid_book)    

        let sum = 0;
        let counter =0;
        
        while( sum < input_amount ){
            console.log(result2.rows[counter].output_amount);
            sum += result2.rows[counter].output_amount;
            counter++;
            console.log(sum, " &&&&&&&&&&&&&&&&&&&")
        }

        console.log(sum)
        console.log(counter)
        console.log(input_amount)

        if( sum==input_amount ){

            macht_orders_2(user_id, order_id, transaction_id, input_coin, output_coin, input_amount, useful_orders_in_bid_book, counter, sum);
            
        }

}


function limit_order_totally_completed(){

}

function limit_order_partially_completed(){

}

function exchange_funds_between_traders( trader1_order_id, trader2_order_id ){

}



module.exports = {
    macth_limit_order,
    execute_market_order,
    execute_limit_order
};