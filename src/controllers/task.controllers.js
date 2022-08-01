const pool = require('../db');

const getAllTask = async (req, res) => {
    try {
        const allTask = await pool.query('SELECT * FROM users');
    
        // console.log(allTask);
        // res.send('tareas');
        res.json(allTask.rows);
    } catch (error) {
        console.log(error.message);
    }
};

const hello = (req, res) => {
    res.send('hello world');
};

const getTask = async (req, res) => {
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
        console.log(error.message);
    }
};

const createTask = async (req, res) => {
    // const task = req.body;
    const {email, password } = req.body;

    try {
        const result = await pool.query('INSERT INTO users(email, password) VALUES ($1, $2) RETURNING *',
                                       [email, password]);
    
        console.log(result);
        res.json(result.rows[0]);

    } catch (error) {
        console.log(error.message);
        res.json( {error: error.message} );
    }

};

const deleteTask =  async (req, res) => {
    
    const {id} = req.params;
    
    const result = await pool.query('DELETE FROM users WHERE user_id = $1', [id]);
    
    if (result.rowCount ==0 ) {
        return res.status(404).json( {message: "user not found"} );
    }

    return res.sendStatus(204);
}; 


const updateTask = async (req, res) => {

    const {id} = req.params;
    const {email, password} = req.body;

    const result = await pool.query(
        'UPDATE users SET password= $1 WHERE user_id= $2 RETURNING *',
        [password, id])

    if (result.rows.length == 0) {
        return res.status(404).json( {message: "user not found"} );
    }

    return res.json(result.rows[0]);
};


module.exports = {
    getAllTask, // es igual a getAllTask: getAllTask
    hello, 
    getTask,
    createTask,
    deleteTask,
    updateTask
};