const express = require('express')
const multer = require('multer')
const sharp = require('sharp')
const User = require('./../models/user')
const router = express.Router()
const auth = require('./../middleware/auth')
const { sendWelcomeMail,sendCancellationMail } = require('../emails/account')

// Create User
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        await user.save();
        sendWelcomeMail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({user, token})
    } catch (e) {
        console.log(e.message)
        res.status(400).send(e)
    }
});

// login user
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredential(req.body.email, req.body.password);
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(404).send({error: e.message})
    }
});

// logout user
router.post('/users/logout', auth, async (req, res) => {
    try {
        const user = req.user

        user.tokens = user.tokens.filter((token) => {
            token.token !== req.token
        })

        user.save()

        res.status(200).send({message: "Logout successfully!"})
    } catch (e) {
        res.status(500).send({error: e.message})
    }
});

// logout all tokens of user
router.post('/users/logoutall', auth, async (req, res) => {
    try {
        const user = req.user

        user.tokens = []

        user.save()

        res.status(200).send()
    } catch (e) {
        res.status(500).send({error: e.message})
    }
});

// Get users
router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).send(users)
    } catch (e) {
        res.status(500).send(e)
    }
});

// Get users
router.get('/users/me', auth, async (req, res) => {
    try {
        res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
});


// Update user
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowUpdates = ['name', 'email', 'password', 'age']

    const isValidData = updates.every((update) => allowUpdates.includes(update))

    if (!isValidData) {
        return res.status(400).send({error: "Invalid data"})
    }
    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.status(200).send(req.user)
    } catch (e) {
        console.log(e)
        res.status(400).send(e)
    }
});

// Delete user
router.delete('/users/me', auth, async (req, res) => {
    try {
        req.user.remove()
        sendCancellationMail(req.user.email, req.user.name)
        res.status(200).send(req.user)
    } catch (e) {
        res.status(400).send(e)
    }
});

// Define multer and add validation rules to upload avatar images
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('Invalid avatar. Please upload image files'))
        }
        cb(undefined, true)
    }
})

// Upload avatars
router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer();
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
});

// Delete avatars
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
});

// Fetch user avatar
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error('No avatar found!')
        }

        res.set('Content-type', 'image/jpg')
        res.send(user.avatar)

    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router