const express = require('express')
const Task = require('./../models/task')
const router = express.Router()
const auth = require('./../middleware/auth')

// Create Task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save();
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
});

// Get tasks
router.get('/tasks', auth, async (req, res) => {
    try {
        const match = {}
        const sort = {}

        if (req.query.completed) {
            match.completed = req.query.completed === 'true'
        }

        if (req.query.sortBy) {
            const parts = req.query.sortBy.split(':')
            sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
        }

        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        const tasks = await req.user.tasks;
        res.status(200).send(tasks)
    } catch (e) {
        res.status(500).send(e)
    }
});

// Get task by id
router.get('/tasks/:id', auth ,async (req, res) => {

    try {
        const _id = req.params.id
        const task = await Task.find({_id: _id, owner: req.user._id});
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        console.log(e)
        res.status(500).send(e)
    }
});

// Update task
router.patch('/tasks/:id', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body)
        const allowUpdates = ['description', 'completed']

        const isValidData = updates.every((update) => allowUpdates.includes(update))

        if (!isValidData) {
            return res.status(400).send({error: "Invalid data"})
        }

        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})

        if (!task) {
            return res.status(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])

        await task.save()

        res.status(200).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
});

// Delete task
router.delete('/tasks/:id', auth, async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id});
        if (!task) {
            return res.status(404).send()
        }
        res.status(200).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
});

module.exports = router