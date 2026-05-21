const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/user');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const getAdminSeedConfig = () => ({
    name: process.env.ADMIN_NAME || 'Admin User',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
});

const seedAdminUser = async () => {
    const { name, email, password } = getAdminSeedConfig();

    if (!email || !password) {
        console.warn('Admin seed skipped: ADMIN_EMAIL and ADMIN_PASSWORD are required.');
        return null;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const existingAdmin = await User.findOne({ email });

    if (existingAdmin) {
        existingAdmin.name = name;
        existingAdmin.password = passwordHash;
        existingAdmin.authProvider = 'local';
        existingAdmin.emailVerified = true;
        existingAdmin.role = 'admin';
        existingAdmin.providerId = null;
        existingAdmin.emailVerificationOtpHash = null;
        existingAdmin.emailVerificationOtpExpiresAt = null;
        existingAdmin.emailVerificationSentAt = null;
        existingAdmin.passwordResetOtpHash = null;
        existingAdmin.passwordResetOtpExpiresAt = null;
        existingAdmin.passwordResetSentAt = null;
        await existingAdmin.save();

        console.log(`Admin seed updated for ${email}`);
        return existingAdmin;
    }

    const adminUser = new User({
        name,
        email,
        password: passwordHash,
        authProvider: 'local',
        emailVerified: true,
        role: 'admin',
    });

    await adminUser.save();
    console.log(`Admin seed created for ${email}`);
    return adminUser;
};

module.exports = {
    seedAdminUser,
};

if (require.main === module) {
    const connectDB = require('../config/db');
    const User = require('../models/user');

    (async () => {
        try {
            await connectDB();
            await User.syncIndexes();
            await seedAdminUser();
            process.exit(0);
        } catch (err) {
            console.error('Admin seed failed:', err.message);
            process.exit(1);
        }
    })();
}
