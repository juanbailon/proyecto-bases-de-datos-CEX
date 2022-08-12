CREATE DATABASE crypto_exchange;

CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(45) NOT NULL UNIQUE,
  password VARCHAR(64) NOT NULL
  );

  CREATE TABLE coins (
    ticker_symbol VARCHAR(6) PRIMARY KEY,
    coin_name VARCHAR(40) NOT NULL UNIQUE
  );

  CREATE TABLE user_coins (
    id SERIAL PRIMARY KEY,
    user_id integer NOT NULL,
    ticker_symbol VARCHAR(6) NOT NULL, 

    CONSTRAINT fk_user
      FOREIGN KEY(user_id) 
	    REFERENCES users(user_id)
	    ON DELETE CASCADE,

    CONSTRAINT fk_coin
      FOREIGN KEY(ticker_symbol) 
	    REFERENCES coins(ticker_symbol)
	    ON DELETE CASCADE 
  );

 CREATE TABLE coin_exchange (
    transaction_id SERIAL PRIMARY KEY,
    user_id integer NOT NULL,
    input_coin VARCHAR(6) NOT NULL,
    output_coin VARCHAR(6) NOT NULL,
    input_amount DOUBLE PRECISION NOT NULL,
    output_amount DOUBLE PRECISION,
    fee_percentage NUMERIC(4,2)

    CONSTRAINT fk_user
      FOREIGN KEY(user_id) 
	    REFERENCES users(user_id)
	    ON DELETE CASCADE
  );



CREATE TABLE orders (
  order_id SERIAL PRIMARY KEY,
  transaction_id integer NOT NULL,
  creation_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  close_date TIMESTAMP,
  order_type VARCHAR(6) NOT NULL CHECK ( order_type='limit' OR order_type='market' ),
  execution_price DOUBLE PRECISION,  

  order_book_id integer NOT NULL
);

CREATE TABLE limit_orders (
  order_id integer,
  limit_price DOUBLE PRECISION,

  CONSTRAINT fk_order
      FOREIGN KEY(order_id) 
	    REFERENCES orders(order_id)
	    ON DELETE CASCADE,

  PRIMARY KEY(order_id)
);


CREATE TABLE trades (
  trade_id SERIAL PRIMARY KEY,
  order_id integer NOT NULL,
  execution_date TIMESTAMP,
  execution_price DOUBLE PRECISION,

  CONSTRAINT fk_order
      FOREIGN KEY(order_id) 
	    REFERENCES orders(order_id)
	    ON DELETE CASCADE
);


CREATE TABLE order_book (
  order_book_id integer NOT NULL PRIMARY KEY,
  exchange_pair VARCHAR(13) NOT NULL,
  coin_1 VARCHAR(6) NOT NULL,
  coin_2 VARCHAR(6) NOT NULL,

  bid_book_id integer,
  ask_book_id integer
);


CREATE TABLE bid_book (
  bid_book_id integer NOT NULL,
  order_book_id integer NOT NULL,
  order_id integer NOT NULL,

  CONSTRAINT fk_order
      FOREIGN KEY(order_id) 
	    REFERENCES orders(order_id)
	    ON DELETE CASCADE,

  CONSTRAINT fk_order_book
      FOREIGN KEY(order_book_id) 
	    REFERENCES order_book(order_book_id)
	    ON DELETE CASCADE,

  PRIMARY KEY(bid_book_id, order_book_id, order_id)

);


CREATE TABLE ask_book (
  ask_book_id integer NOT NULL,
  order_book_id integer NOT NULL,
  order_id integer NOT NULL,

  CONSTRAINT fk_order
      FOREIGN KEY(order_id) 
	    REFERENCES orders(order_id)
	    ON DELETE CASCADE,

  CONSTRAINT fk_order_book
      FOREIGN KEY(order_book_id) 
	    REFERENCES order_book(order_book_id)
	    ON DELETE CASCADE,

  PRIMARY KEY(ask_book_id, order_book_id, order_id)

);


ALTER TABLE orders
  ADD CONSTRAINT fk_order_book
  FOREIGN KEY (order_book_id)
  REFERENCES order_book(order_book_id)
  ON DELETE CASCADE;

  
CREATE TABLE exchange_pair_books (
  exchange_pair VARCHAR(13),
  order_book_id integer,
  bid_book_id integer NOT NULL,
  ask_book_id integer NOT NULL,

  PRIMARY KEY(exchange_pair, order_book_id)
);


ALTER TABLE orders
ADD CONSTRAINT fk_coin_exchange
FOREIGN KEY (transaction_id)
REFERENCES coin_exchange(transaction_id)
ON DELETE CASCADE;


CREATE TABLE liquidity_pools (
  liquidity_pool_id SERIAL PRIMARY KEY,
  exchange_pair VARCHAR(13) NOT NULL,
  coin_1 VARCHAR(6) NOT NULL,
  coin_2 VARCHAR(6) NOT NULL,
  amount_coin_1 DOUBLE PRECISION,
  amount_coin_2 DOUBLE PRECISION,
  estimated_apy NUMERIC(4,2)
);


CREATE TABLE liquidity_providers (
  liquidity_provider_id SERIAL PRIMARY KEY,
  user_id integer NOT NULL,
  amount_coin_1 DOUBLE PRECISION,
  amount_coin_2 DOUBLE PRECISION,
  singin_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logout_date TIMESTAMP,
  liquidity_pool_id integer,

  CONSTRAINT fk_liquidity_pool
        FOREIGN KEY(liquidity_pool_id) 
        REFERENCES liquidity_pools(liquidity_pool_id)
        ON DELETE SET NULL
);


  -- ****************************************************************


  INSERT INTO coin_exchange (user_id, input_coin, output_coin, input_amount, output_amount, fee_percentage)
      VALUES (2, 'USDT', 'BTC', 100.325, 0.00256, 1 );

  DELETE FROM order_book WHERE order_book_id=1; 

  INSERT INTO order_book (order_book_id, exchange_pair, coin_1, coin_2, bid_book_id, ask_book_id)
      VALUES (1, 'BTC/USDT', 'BTC', 'USDT', 1, 1);

  INSERT INTO exchange_pair_books (exchange_pair, order_book_id, bid_book_id, ask_book_id) VALUES ('BTC/USDT', 1, 1, 1);

  INSERT INTO orders (transaction_id, order_type, execution_price, order_book_id) VALUES (1, 'limit', '12000', 1);

  INSERT INTO limit_orders(order_id, limit_price) VALUES();

  INSERT INTO bid_book(bid_book_id, order_book_id, order_id) VALUES( 1, 1, 1 );

  

  SELECT orders.order_id, orders.transaction_id, input_amount FROM 
      (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) 
        WHERE order_type='limit'
          ORDER BY input_amount ASC;

          
  SELECT order_id FROM ask_book WHERE order_id IN (
    SELECT orders.order_id FROM 
        (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) 
          WHERE order_type='limit' );


  SELECT orders.order_id, orders.transaction_id, coin_exchange.input_amount FROM 
       ( (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) 
         INNER JOIN bid_book ON orders.order_id = bid_book.order_id )
           ORDER BY coin_exchange.input_amount ASC;
  
  
  --esta si
  SELECT orders.order_id, orders.transaction_id, coin_exchange.input_amount, orders.execution_price FROM 
        (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) 
          WHERE orders.order_book_id = 1 AND orders.order_type = 'limit' AND orders.side = 'buy'
           ORDER BY orders.execution_price ASC;




  SELECT orders.order_id, orders.transaction_id, coin_exchange.input_amount, orders.execution_price FROM 
       ( (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) 
         INNER JOIN bid_book ON orders.order_id = bid_book.order_id )
           ORDER BY orders.execution_price ASC;           



  SELECT * FROM 
       ( (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) 
         INNER JOIN bid_book ON orders.order_id = bid_book.order_id )
           ORDER BY coin_exchange.input_amount ASC;           


  SELECT orders.order_id, orders.transaction_id, coin_exchange.input_amount FROM bid_book WHERE order_id IN (
    SELECT orders.order_id FROM 
        (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) 
          WHERE order_type='limit' );
            



  ALTER TABLE trades
    ADD CONSTRAINT fk_order_id_2
      FOREIGN KEY (order_id_2)
        REFERENCES orders(order_id);

  UPDATE user_coins SET total= , available= , in_orders = WHERE id= ;        

  order_id
transaction_id
creation_date
close_date
order_type
execution_price




SELECT coin_exchange.user_id, orders.order_id, orders.transaction_id, orders.order_type, coin_exchange.input_coin, coin_exchange.output_coin, coin_exchange.input_amount, coin_exchange.output_amount, orders.execution_price FROM 
                        (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) 
                            WHERE orders.order_book_id = $1 AND orders.order_type = $2 AND orders.side = $3 AND status!= 'close' AND coin_exchange.user_id != $4
                                ORDER BY orders.execution_price ASC;



SELECT coin_exchange.user_id, orders.order_id, orders.transaction_id, orders.creation_date, orders.order_type, coin_exchange.input_coin, coin_exchange.output_coin, coin_exchange.input_amount, coin_exchange.output_amount, orders.execution_price FROM 
                        (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id) 
                            WHERE orders.order_book_id = 1 AND orders.order_type = 'limit' AND orders.side = 'sell' AND status!= 'close' AND coin_exchange.user_id != 2 AND orders.execution_price = 2000 AND coin_exchange.output_amount = 2000
                                ORDER BY orders.creation_date ASC;                                




SELECT order_id, input_coin, output_coin, input_amount, output_amount, creation_date, close_date, order_type, execution_price, side, status FROM 
                  (orders INNER JOIN coin_exchange ON orders.transaction_id = coin_exchange.transaction_id ) 
                        WHERE coin_exchange.user_id = $1