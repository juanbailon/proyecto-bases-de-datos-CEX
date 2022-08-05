const { Router } = require('express');
const { createNewUser, getSignUpPage, getLogin, signIn, getTrade, trade_limit, trade_market, provideLiquidity, getAllTask, hello, getTask, createTask, deleteTask, updateTask } = require('../controllers/task.controllers');

const router = Router();


router.get('/', getLogin);

router.post('/', signIn);

router.get('/sign-up', getSignUpPage);

router.post('/sign-up', createNewUser);

router.get('/trade', getTrade);

router.post('/trade', trade_limit);

router.post('/provide-liquidity', provideLiquidity);


//******************************* */

router.get('/tasks', getAllTask);

//router.get('/', hello);

router.get('/tasks/:id', getTask);

//envia tarea an back
router.post('/tasks', createTask);

router.delete('/tasks/:id', deleteTask);

//actualiza tarea
router.put('/tasks/:id', updateTask);

/************************************************* */

module.exports = router;