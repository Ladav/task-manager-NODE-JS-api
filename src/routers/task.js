const express = require('express');
const Task = require('../models/task');
const Auth = require('../middleware/auth');

const router = new express.Router();

/////////////////////////////////////
// setting up task resource endpoints

/**Create task */
router.post('/tasks', Auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch(e) {
        res.status(500).send(e);    // when server is down status - 500
    }
});

/**reading multiple task */
// GET- /tasks?completed=true||false    -(three behaviours-> return all completed tasks or all incompleted tasks or return all tasks)
// GET- /tasks?limit=3&skip=10      -(limit-> number of results to be returned, skip-> skip the first 10 and send the following 3(limit=3))
// GET- /tasks?sortBy=createdAt:desc||asc       -(createdAt-> is column, basis on which the documents will be sorted (it can be any column i.e completed) and in asc||desc order)
router.get('/tasks', Auth, async (req, res) => {
    const match = {};   // when match is emtpy return all tasks
    const sort = {};

    if(req.query.completed) {
        match.completed = (req.query.completed.toLowerCase().trim() === 'true');
    }

    if(req.query.sortBy) {
        // ex- req.query.sortBy-> completed:desc
        const args = req.query.sortBy.split(':');       // ['completed', 'desc']
        const sortOrder = args[1] === 'desc' ? -1 : 1;   // 1->asc(default) and -1->desc

        sort[args[0]] = sortOrder;      // sort = { completed : 1||-1 }
    }

    try {
        await req.user.populate({
            path: 'userTasks',      // name of the relation
            match,                  // matching criteria
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.status(200).send(req.user.userTasks);
    } catch(e) {
        res.status(500).send(e);
    }
});

/**reading single task (by id using-req's param object) */
router.get('/tasks/:id', Auth, async (req, res) => {
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

        if(!task) {
            return res.status(404).send();
        }
        res.status(200).send(task);
    } catch(e) {
        res.status(500).send(e);
    }
});


/**Update task by id using-req's param object */
router.patch('/tasks/:id', Auth, async (req, res) => {
    const requestedUpdates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed'];
    const isAllowed = requestedUpdates.every(update => allowedUpdates.includes(update));

    if(!isAllowed) {
        return res.status(400).send({ error: 'invalid update!' });
    }

    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
        if(!task) {
            return res.status(404).send();
        }

        requestedUpdates.forEach(update => task[update] = req.body[update]);

        await task.save();
        res.send(task);
    } catch(e) {
        res.status(500).send(e);
    }
});

/**Delete single user */
router.delete('/tasks/:id', Auth, async (req, res) => {
    try{
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

        if(!task) {
            return res.status(404).send();
        }

        res.send(task);
    } catch(e) {
        res.status(500).send(e);
    }
});

module.exports = router;