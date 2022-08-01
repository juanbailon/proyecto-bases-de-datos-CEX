const express = require('express');
const app = express();
const morgan = require('morgan');

const port = 4000;
const taskRoutes = require('./routes/task.routes');

app.use(express.json());
app.use(morgan('dev'));
app.use(taskRoutes);

app.listen(port, () => {
    console.log('server startes on port ', port);
});



