const express = require('express');
const User = require("../models/user");
// Middlewares
const multer = require('multer');
const sharp = require('sharp');
const userAuth = require('../middleware/userAuthentication');

const router = new express.Router();

router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const userAuthToken = await user.generateAuthToken();
        res.status(201).send({user, token: userAuthToken});
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body);
        const userAuthToken = await user.generateAuthToken();
        res.send({user, token: userAuthToken});
    } catch (e) {
        res.status(400).send(e);
    }
});

router.post('/users/logout', userAuth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.post('/users/logoutAll', userAuth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/users', userAuth, async (req, res) => {
    try {
        const users = await User.find({});
        res.send(users);
    } catch (e) {
        res.status(500).send();
    }
});

router.get('/users/me', userAuth, async (req, res) => {
    res.send(req.user);
});

router.patch('/users/me', userAuth, async (req, res) => {
    // check for the fields validity
    const updateFields = Object.keys(req.body);
    const updateFieldsAllowed = ['name', 'age', 'email', 'password'];
    const isValidUpdate = updateFields.every(updateField => updateFieldsAllowed.includes(updateField));

    if (!isValidUpdate) {
        res.status(400).send({error: 'invalid update fields'});
        return;
    }

    try {
        updateFields.forEach(updateField => {
            req.user[updateField] = req.body[updateField];
        });
        await req.user.save();

        res.send(req.user);
    } catch (e) {
        res.status(400).send(e);
    }
});

router.delete('/users/me', userAuth, async (req, res) => {
    try {
        await req.user.remove();
        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

const uploadAvatars = multer({
    limits: {
        fileSize: 1000000 // 1MB
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('incorrect file type.'));
            return;
        }

        cb(undefined, true);
    }
});

router.post('/users/me/avatar', userAuth, uploadAvatars.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize(250, 250).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
    },
    (e, req, res, next) => {
        res.status(400).send({error: e.message});
    }
);

router.delete('/users/me/avatar', userAuth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

router.get('/users/:id/avatar', async (req, res) => {
    try {
        const _id = req.params.id;
        const user = await User.findById(_id);

        if (!user || !user.avatar) throw new Error();

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    }
    catch (e) {
        res.status(404).send();
    }
})

module.exports = router;