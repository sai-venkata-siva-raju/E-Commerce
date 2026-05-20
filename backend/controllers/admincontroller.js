const User = require('../models/user');

exports.getAdminDashboard = async (req, res) => {
    try {
        const [totalUsers, verifiedUsers, adminUsers, localUsers, googleUsers] =
            await Promise.all([
                User.countDocuments(),
                User.countDocuments({ emailVerified: true }),
                User.countDocuments({ role: 'admin' }),
                User.countDocuments({ authProvider: 'local' }),
                User.countDocuments({ authProvider: 'google' }),
            ]);

        res.json({
            stats: {
                totalUsers,
                verifiedUsers,
                adminUsers,
                localUsers,
                googleUsers,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password -emailVerificationOtpHash -passwordResetOtpHash')
            .sort({ createdAt: -1 });

        res.json({ users });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.json({
            message: 'User role updated successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
};
