const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const validator = require("validator");
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    age: {
        type: Number,
        validate(value) {
            if (value < 0) throw Error('Invalid age value.');
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) throw Error('Invalid email format.');
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 6,
        validate(value) {
            if (value.toLowerCase().includes('password')) throw Error('Invalid password.');
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
});

userSchema.virtual('tasks', {
    ref: Task,
    localField: '_id',
    foreignField: 'creator'
});

userSchema.methods.generateAuthToken = async function() {
    const authToken = jwt.sign({_id: this._id.toString()}, process.env.JWT_SECRET);
    this.tokens = this.tokens.concat({token: authToken});
    await this.save();
    return authToken;
};

userSchema.methods.toJSON = function() {
    const userObject = this.toObject();

    delete userObject.avatar;
    delete userObject.password;
    delete userObject.tokens;

    return userObject;
}

userSchema.statics.findByCredentials = async ({email, password}) => {
    const user = await User.findOne({email});
    if (!user) throw Error('User not found.');

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) throw Error('Login failed.');

    return user;
};

// password hashing
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// remove the tasks created after the user is deleted
userSchema.pre('remove', async function(next) {
    await Task.deleteMany({creator: this._id});
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;