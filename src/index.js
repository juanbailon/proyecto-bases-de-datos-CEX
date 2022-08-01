const express = require('express');
const app = express();
const morgan = require('morgan');

const port = 4000;
const taskRoutes = require('./routes/task.routes');

app.use(express.json());
app.use(morgan('dev'));

app.use(taskRoutes);

//middleware para proceso de errores
app.use( (error, req, res, next) => {
    return res.json({
        message: error.message 
    });
} );

app.listen(port, () => {
    console.log('server startes on port ', port);
});



