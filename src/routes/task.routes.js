const { Router } = require('express');
const { createNewUser, getSignUpPage, getLogin, signIn, getTrade, trade_limit, getFunds, checkFunds, getMyAccount, getUserInfo, getOrders, getOrdersInfo, getUserOrders, deleteLimitOrder, provideLiquidity, getAllTask, hello, getTask, createTask, deleteTask, updateTask } = require('../controllers/task.controllers');

const router = Router();


router.get('/', getLogin);

router.post('/', signIn);

router.get('/sign-up', getSignUpPage);

router.post('/sign-up', createNewUser);

router.get('/trade', getTrade);

router.post('/trade', trade_limit);

router.post('/provide-liquidity', provideLiquidity);

router.get('/funds', getFunds);

router.post('/funds', checkFunds );

router.get('/my-account', getMyAccount );

router.get('/my-account/:email', getUserInfo );

router.get('/orders', getOrders );

router.get('/orders/:userId', getUserOrders );

router.post('/orders', getOrdersInfo );

router.delete('/orders', deleteLimitOrder );



module.exports = router;