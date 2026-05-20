const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: function () {
            return this.authProvider === 'local';
        }
    },
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    providerId: {
        type: String,
        default: null
    },
    avatar: {
        type: String,
        default: ''
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationOtpHash: {
        type: String,
        default: null
    },
    emailVerificationOtpExpiresAt: {
        type: Date,
        default: null
    },
    emailVerificationSentAt: {
        type: Date,
        default: null
    },
    passwordResetOtpHash: {
        type: String,
        default: null
    },
    passwordResetOtpExpiresAt: {
        type: Date,
        default: null
    },
    passwordResetSentAt: {
        type: Date,
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
