const jwt = require('jsonwebtoken');
const User = require('../models/user');

const auth = async (req, res, next) => {
    try {
        const userAuthToken = req.header('Authorization').replace('Bearer ', '');
        const decodedToken = jwt.verify(userAuthToken, process.env.JWT_SECRET);
        const user = await User.findOne({_id: decodedToken._id, 'tokens.token': userAuthToken});

        if (!user) throw Error();

        req.user = user;
        req.token = userAuthToken;
        next();
    }
    catch (e) {
        res.status(401).send({error: 'Authentication failed.'});
    }
}

module.exports = auth;