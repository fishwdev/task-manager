const express = require('express');
const Task = require("../models/task");
// Middlewares
const userAuth = require('../middleware/userAuthentication');

const router = new express.Router();

router.post('/tasks', userAuth, async (req, res) => {
    const task = new Task({
        ...req.body,
        creator: req.user._id
    });

    try {
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.get('/tasks', userAuth, async (req, res) => {
    const match = {};
    if (req.query.isCompleted) match.isCompleted = (req.query.isCompleted === 'true');

    const sort = {};
    if (req.query.sort) {
        // [0]: sortField, [1]: sort order
        const sortInfo = req.query.sort.split(':');
        sort[sortInfo[0]] = (sortInfo[1] === 'desc' ? -1 : 1);
    }

    try {
        // alternative approach
        // const tasks = await Task.find({creator: req.user._id});
        // res.send(tasks);
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        });

        if (req.user.tasks.length === 0) {
            res.status(404).send();
        }

        res.send(req.user.tasks);
    } catch (e) {
        console.log(e);
        res.status(500).send();
    }
});

router.get('/tasks/:id', userAuth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOne({_id, creator: req.user._id});
        if (!task) {
            res.status(404).send();
            return;
        }
        res.send(task);
    } catch (e) {
        res.status(500).send();
    }
});

router.patch('/tasks/:id', userAuth, async (req, res) => {
    const updateFields = Object.keys(req.body);
    const updateFieldsAllowed = ['description', 'isCompleted'];
    const isValidUpdate = updateFields.every(updateField => updateFieldsAllowed.includes(updateField));

    if (!isValidUpdate) {
        res.status(400).send({error: 'invalid update fields'});
        return;
    }

    const _id = req.params.id;

    try {
        const task = await Task.findOne({_id, creator: req.user._id});

        if (!task) {
            res.status(404).send();
            return;
        }

        updateFields.forEach(updateField => {
            task[updateField] = req.body[updateField];
        });
        await task.save();

        res.send(task);
    } catch (e) {
        res.status(400).send();
    }
});

router.delete('/tasks/:id', userAuth, async (req, res) => {
    const _id = req.params.id;

    try {
        const task = await Task.findOneAndDelete({_id, creator: req.user._id});

        if (!task) {
            res.status(404).send();
            return;
        }

        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }

});

module.exports = router;