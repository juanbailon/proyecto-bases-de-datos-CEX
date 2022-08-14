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
    total integer,
    available integer,
    in_orders integer,
    in_liq_pools integer, 

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
    fee_percentage NUMERIC(4,2),

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

  order_book_id integer NOT NULL,

  side VARCHAR(4),
  status VARCHAR(15)
);


CREATE TABLE trades (
  trade_id SERIAL PRIMARY KEY,
  order_id_1 integer NOT NULL,
  execution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  execution_price DOUBLE PRECISION,
  order_id_2 integer NOT NULL,

  CONSTRAINT fk_order_id_1
      FOREIGN KEY(order_id_1) 
	    REFERENCES orders(order_id)
	    ON DELETE CASCADE,

  CONSTRAINT fk_order_id_2
      FOREIGN KEY(order_id_2) 
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


INSERT INTO coins (ticker_symbol, coin_name) 
  VALUES ('BTC', 'bitcoin'),
         ('USDT', 'tether_USD'),
         ('ADA', 'cardano_ADA');