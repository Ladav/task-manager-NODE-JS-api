const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const Auth = require('../middleware/auth');
const { sendWelcomeEmail, sendCancelationEmail } = require('../emails/account');

const router = new express.Router();

/////////////////////////////////////
// setting up user resource endpoints
/**Create User */
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name);
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token });
    }
    catch(e) {
        res.status(400).send(e);
    }
})

/**login User */
router.post('/users/login', async (req, res) => {   // req.body will contain email and password
    try {
        const user = await User.findByCredentials(req.body.email,req.body.password);   // findByCredentials is user defined function to provide login functionality
        const token = await user.generateAuthToken();   // it is called on user(instead of 'U'ser) as it is a instance method not model method
        res.send({ user, token });
    } catch(e) {
        res.status(400).send(e);
    }
});

/**logging out*/
router.post('/users/logout', Auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        });
        await req.user.save();

        res.send();
    } catch(e) {
        res.status(500).send();
    }
});

/**logout All */
router.post('/users/logoutAll',Auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send();
    } catch(e) {
        res.status(500).send();
    }
});

/**Read user profile */ 
router.get('/users/me', Auth, async (req, res) => {
    res.send(req.user);
});

/**Update single user by id using-req's param object */
router.patch('/users/me', Auth, async (req, res) => {
    const requestedUpdates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isAllowed = requestedUpdates.every(update => allowedUpdates.includes(update));

    if(!isAllowed) {
        return res.status(400).send({ error: 'invalid update!'});
    }

    try {
        requestedUpdates.forEach(update => req.user[update] = req.body[update]);    // updating 
        await req.user.save();    // saving changes
        res.send(req.user);
    } catch(e) {
        res.status(400).send({error: e});
    }
});

/**Delete user */
router.delete('/users/me', Auth, async (req, res) => {
    try {
        sendCancelationEmail(req.user.email, req.user.name);
        await req.user.remove();    // it removes the user from the database
        res.send(req.user);
    } catch(e) {
        res.status(500).send(e);
    }
});

/**upload profile image */
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {     // file-> contain infomation about file , cb-> callback function
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('please upload a Image, try jpg, jpeg or png'));   // rejecting upload
        }

        cb(undefined, true);    // accepting the file
    }
});

router.post('/users/me/avatar', Auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ height: 250, width: 250 }).png().toBuffer();   // all image will be saved as png of 250x250 size(the client can provide a jpeg but sharp will convert it to png)

    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {     // writing all four argument is compulsory as it help express to recoginise this function as error handler
    res.status(400).send({ error: error.message });
});

/**remove image */
router.delete('/users/me/avatar', Auth, async (req, res) => {
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

/**Fetch user's Profile */
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if(!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png');
        res.send(user.avatar);
    } catch(e) {
        res.status(404).send();
    }
});

module.exports = router;