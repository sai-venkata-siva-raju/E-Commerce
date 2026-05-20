const jwt = require('jsonwebtoken');
const RevokedToken = require('../models/revokedtoken');
const User = require('../models/user');

const parseCookies = (cookieHeader = '') =>
    cookieHeader.split(';').reduce((cookies, pair) => {
        const [rawKey, ...rawValueParts] = pair.trim().split('=');

        if (!rawKey) {
            return cookies;
        }

        cookies[decodeURIComponent(rawKey)] = decodeURIComponent(rawValueParts.join('=') || '');
        return cookies;
    }, {});

const extractToken = (req) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    const cookies = parseCookies(req.headers.cookie);
    if (cookies.auth_token) {
        return cookies.auth_token;
    }

    return req.body?.token || req.query?.token || null;
};

const authenticateToken = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const revoked = await RevokedToken.findOne({ token });
        if (revoked) {
            return res.status(401).json({ message: 'Token has been logged out' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        req.token = token;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const requireUser = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(userId).select('role emailVerified authProvider');

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (user.authProvider === 'local' && !user.emailVerified) {
            return res.status(403).json({ message: 'Please verify your email first' });
        }

        req.currentUser = user;
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

const requireAdmin = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const user = await User.findById(userId).select('role emailVerified authProvider');

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        if (user.authProvider === 'local' && !user.emailVerified) {
            return res.status(403).json({ message: 'Please verify your email first' });
        }

        req.adminUser = user;
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    authenticateToken,
    requireUser,
    requireAdmin,
    extractToken,
};
