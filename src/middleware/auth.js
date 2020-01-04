const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded._id, 'tokens.token' : token });

        if(!user) {
            throw new Error();
        }

        req.token = token;    // will be used in logging out 
        req.user = user;    // so that we don't have to fetch the user again in users/me
        next();
    }
    catch(e) {
        res.status(401).send({ error: 'Please Authenticate!' });
    }
};

module.exports = auth;