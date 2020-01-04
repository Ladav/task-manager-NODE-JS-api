const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error('invalid emial address!');
            }
        }
    }, 
    password: {
        type: String,
        trim: true,
        minlength: 7,
        required: true,
        validate(value) {
            if(value.toLowerCase().includes('password')) {
                throw new Error('use a strong password!');
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if(value < 0) {
                throw new Error('age can\'t be negative');
            }
        }
    },
    tokens : [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true    // by defaut- false, now for new document entry a timestamp will be save in it about when the user(document/entry) was created and when it is last updated
});

// virtual is used to establish a relationship between two collections
userSchema.virtual('userTasks', {    // it will be used to refer tasks belong to user ex user.userTasks
    ref: 'Task',   // collection(table) whom to refer 
    localField: '_id',   // _id is the property of User
    foreignField: 'owner'   // owner is the property Task
});

// this method facilate privacy by hiding hashed password and tokens array
// toJSON special function gets called everytime the object gets stringify
userSchema.methods.toJSON = function () {         // Instance methods
    const user = this.toObject(); // because this will provide us object with some mongoose layers over it

    const infoToBeRemoved = ['password', 'tokens', 'avatar'];

    infoToBeRemoved.forEach(info => {
        delete user[info];
    });

    return user;
}

// generate token
userSchema.methods.generateAuthToken = async function () {        // Instance methods
    const user = this;
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);

    user.tokens.push({ token });
    // or ->user.tokens = user.tokens.concat({token});
    await user.save();

    return token;
}

// findByCredentials is a user defined function to provide login functionality
userSchema.statics.findByCredentials = async (email, password) => {             // model methods
    const user = await User.findOne({email});
    if(!user) {
        throw new Error('Unable to login!');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        throw new Error('Unable to login!');
    }
    return user;
};

// hash password before save
userSchema.pre('save', async function(next) {      // mongoose middleware
    const user = this;

    if(user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }
    
    next();
});

// delete tasks, when the user is removed
userSchema.pre('remove', async function(next) {     // mongoose middleware
    const user = this;
    await Task.deleteMany({ owner: user._id });
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;