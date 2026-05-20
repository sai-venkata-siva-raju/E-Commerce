const User = require('../models/user');
const RevokedToken = require('../models/revokedtoken');
const {
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
} = require('../config/mailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const isProduction = process.env.NODE_ENV === 'production';
const authCookieOptions = {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 60 * 60 * 1000,
};

const signToken = (user) =>
    new Promise((resolve, reject) => {
        const payload = { user: { id: user.id } };
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    return reject(err);
                }

                resolve(token);
            }
        );
    });

const sendAuthResponse = async (res, user) => {
    const token = await signToken(user);
    res.cookie('auth_token', token, authCookieOptions);
    res.json({
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            authProvider: user.authProvider,
            avatar: user.avatar,
            emailVerified: user.emailVerified,
        },
    });
};

const generateOtp = () => String(crypto.randomInt(100000, 1000000));

const hashOtp = async (otp) => bcrypt.hash(otp, 10);

const getOtpExpiry = (minutesEnvName, defaultMinutes = 10) =>
    new Date(Date.now() + Number(process.env[minutesEnvName] || defaultMinutes) * 60 * 1000);

exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            if (existingUser.emailVerified) {
                return res.status(400).json({ message: 'User already exists' });
            }

            return res.status(400).json({
                message: 'Account already exists but is not verified. Please verify the OTP sent to your email.',
            });
        }
        const salt = await bcrypt.genSalt(10);
        const otp = generateOtp();
        const user = new User({
            name,
            email,
            password: await bcrypt.hash(password, salt),
            authProvider: 'local',
            emailVerified: false,
            emailVerificationOtpHash: await hashOtp(otp),
            emailVerificationOtpExpiresAt: getOtpExpiry('OTP_EXPIRES_MINUTES'),
            emailVerificationSentAt: new Date(),
        });
        await user.save();
        try {
            await sendVerificationEmail({ email: user.email, name: user.name, otp });
        } catch (mailErr) {
            console.error('Verification email failed:', mailErr.message);
        }
        res.status(201).json({
            message: 'Registration successful. Please verify the OTP sent to your email.',
            email: user.email,
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (user.authProvider !== 'local') {
            return res.status(400).json({
                message: 'This account uses social login. Please sign in with Google.',
            });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        if (user.authProvider === 'local' && !user.emailVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in.',
            });
        }
        await sendAuthResponse(res, user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.verifyEmail = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        if (!user.emailVerificationOtpHash || !user.emailVerificationOtpExpiresAt) {
            return res.status(400).json({ message: 'No verification code found. Please request a new one.' });
        }

        if (user.emailVerificationOtpExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        const isOtpValid = await bcrypt.compare(String(otp).trim(), user.emailVerificationOtpHash);

        if (!isOtpValid) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        user.emailVerified = true;
        user.emailVerificationOtpHash = null;
        user.emailVerificationOtpExpiresAt = null;
        user.emailVerificationSentAt = null;
        await user.save();

        try {
            await sendWelcomeEmail({ email: user.email, name: user.name });
        } catch (mailErr) {
            console.error('Welcome email failed:', mailErr.message);
        }

        await sendAuthResponse(res, user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.resendVerificationOtp = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        const otp = generateOtp();
        user.emailVerificationOtpHash = await hashOtp(otp);
        user.emailVerificationOtpExpiresAt = getOtpExpiry('OTP_EXPIRES_MINUTES');
        user.emailVerificationSentAt = new Date();
        await user.save();

        try {
            await sendVerificationEmail({ email: user.email, name: user.name, otp });
        } catch (mailErr) {
            console.error('Verification email resend failed:', mailErr.message);
        }

        res.json({
            message: 'A new verification OTP has been sent to your email.',
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user || user.authProvider !== 'local') {
            return res.json({
                message: 'If an account exists, a password reset code has been sent.',
            });
        }

        if (!user.emailVerified) {
            return res.status(400).json({
                message: 'Please verify your email before resetting your password.',
            });
        }

        const otp = generateOtp();
        user.passwordResetOtpHash = await hashOtp(otp);
        user.passwordResetOtpExpiresAt = getOtpExpiry('PASSWORD_RESET_OTP_EXPIRES_MINUTES');
        user.passwordResetSentAt = new Date();
        await user.save();

        try {
            await sendPasswordResetEmail({ email: user.email, name: user.name, otp });
        } catch (mailErr) {
            console.error('Password reset email failed:', mailErr.message);
        }

        res.json({
            message: 'If an account exists, a password reset code has been sent.',
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ message: 'Email, OTP, and new password are required' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.authProvider !== 'local') {
            return res.status(400).json({
                message: 'This account uses social login. Please sign in with Google.',
            });
        }

        if (!user.emailVerified) {
            return res.status(400).json({
                message: 'Please verify your email before resetting your password.',
            });
        }

        if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
            return res.status(400).json({
                message: 'No password reset code found. Please request a new one.',
            });
        }

        if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
            return res.status(400).json({
                message: 'Password reset code has expired. Please request a new one.',
            });
        }

        const isOtpValid = await bcrypt.compare(String(otp).trim(), user.passwordResetOtpHash);

        if (!isOtpValid) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.passwordResetOtpHash = null;
        user.passwordResetOtpExpiresAt = null;
        user.passwordResetSentAt = null;
        await user.save();

        await sendAuthResponse(res, user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.googleAuth = async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: 'Google credential is required' });
    }

    try {
        const response = await fetch(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
        );

        if (!response.ok) {
            return res.status(401).json({ message: 'Invalid Google credential' });
        }

        const profile = await response.json();
        const expectedClientId = process.env.GOOGLE_CLIENT_ID;

        if (expectedClientId && profile.aud !== expectedClientId) {
            return res.status(401).json({ message: 'Invalid Google client' });
        }

        if (String(profile.email_verified) !== 'true') {
            return res.status(401).json({ message: 'Google account email is not verified' });
        }

        const email = profile.email;
        const providerId = profile.sub;
        const name =
            profile.name || profile.given_name || email?.split('@')?.[0] || 'Google User';
        const avatar = profile.picture || '';

        let user = await User.findOne({ email });

        if (user) {
            user.providerId = user.providerId || providerId;
            user.avatar = user.avatar || avatar;
            if (!user.authProvider) {
                user.authProvider = 'google';
            }
            user.emailVerified = true;
            user.emailVerificationOtpHash = null;
            user.emailVerificationOtpExpiresAt = null;
            user.emailVerificationSentAt = null;
            await user.save();
        } else {
            user = new User({
                name,
                email,
                authProvider: 'google',
                providerId,
                avatar,
                emailVerified: true,
            });
            await user.save();
        }

        await sendAuthResponse(res, user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.logoutUser = async (req, res) => {
    const token = req.token;

    if (!token) {
        return res.status(400).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.decode(token);
        if (!decoded || !decoded.exp) {
            return res.status(400).json({ message: 'Invalid token' });
        }

        await RevokedToken.findOneAndUpdate(
            { token },
            { token, expiresAt: new Date(decoded.exp * 1000) },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.clearCookie('auth_token', authCookieOptions);
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
