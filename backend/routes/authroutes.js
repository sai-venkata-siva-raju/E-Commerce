const express= require('express');
const router= express.Router();
const {
    registerUser,
    loginUser,
    verifyEmail,
    resendVerificationOtp,
    forgotPassword,
    resetPassword,
    googleAuth,
    logoutUser,
} = require('../controllers/authcontroler');
const authenticateToken = require('../middleware/auth');
const requireUser = require('../middleware/user');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendVerificationOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/google', googleAuth);
router.get('/user', authenticateToken, requireUser, (req, res) => {
    res.json({ user: req.user });
}); 
router.post('/logout', authenticateToken, logoutUser);

module.exports = router;
