const { Router } = require('express');
const { getAllTask, hello, getTask, createTask, deleteTask, updateTask } = require('../controllers/task.controllers');

const router = Router();

router.get('/tasks', getAllTask);

router.get('/', hello);

router.get('/tasks/:id', getTask);

//envia tarea an back
router.post('/tasks', createTask);

router.delete('/tasks/:id', deleteTask);

//actualiza tarea
router.put('/tasks/:id', updateTask);

module.exports = router;