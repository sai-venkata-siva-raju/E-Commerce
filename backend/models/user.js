const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        trim: true,
        default: undefined
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

userSchema.pre('validate', function () {
    if (!this.name) {
        const emailLocalPart = this.email?.split('@')?.[0];
        this.name = emailLocalPart || 'User';
    }
});

userSchema.index(
    { username: 1 },
    {
        unique: true,
        partialFilterExpression: {
            username: { $type: 'string' },
        },
    }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
