const mongoose = require('mongoose');

const dbConnectionURL = process.env.MONGODB_URL;

mongoose.connect(dbConnectionURL);