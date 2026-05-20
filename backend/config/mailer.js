const nodemailer = require('nodemailer');

const hasMailConfig =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

const createTransporter = () => {
    if (!hasMailConfig) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const sendWelcomeEmail = async ({ email, name }) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.log('Welcome email skipped: SMTP configuration is missing.');
        return false;
    }

    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;
    const appName = process.env.APP_NAME || 'Your Store';

    await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `Welcome to ${appName}`,
        text: `Hi ${name},\n\nWelcome to ${appName}! Your account has been created successfully.\n\nWe're glad to have you with us.\n`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
                <h2>Welcome to ${appName}</h2>
                <p>Hi ${name},</p>
                <p>Your account has been created successfully.</p>
                <p>We're glad to have you with us.</p>
            </div>
        `,
    });

    return true;
};

const sendVerificationEmail = async ({ email, name, otp }) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.log('Verification email skipped: SMTP configuration is missing.');
        return false;
    }

    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;
    const appName = process.env.APP_NAME || 'Your Store';

    await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `Verify your email for ${appName}`,
        text: `Hi ${name},\n\nYour verification code is ${otp}.\nIt expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.\n\nIf you did not create this account, you can ignore this email.\n`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
                <h2>Verify your email</h2>
                <p>Hi ${name},</p>
                <p>Your verification code is:</p>
                <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${otp}</div>
                <p>This code expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes.</p>
                <p>If you did not create this account, you can ignore this email.</p>
            </div>
        `,
    });

    return true;
};

const sendPasswordResetEmail = async ({ email, name, otp }) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.log('Password reset email skipped: SMTP configuration is missing.');
        return false;
    }

    const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;
    const appName = process.env.APP_NAME || 'Your Store';

    await transporter.sendMail({
        from: fromAddress,
        to: email,
        subject: `Reset your password for ${appName}`,
        text: `Hi ${name},\n\nYour password reset code is ${otp}.\nIt expires in ${process.env.PASSWORD_RESET_OTP_EXPIRES_MINUTES || 10} minutes.\n\nIf you did not request this, you can ignore this email.\n`,
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #222;">
                <h2>Reset your password</h2>
                <p>Hi ${name},</p>
                <p>Your password reset code is:</p>
                <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; margin: 16px 0;">${otp}</div>
                <p>This code expires in ${process.env.PASSWORD_RESET_OTP_EXPIRES_MINUTES || 10} minutes.</p>
                <p>If you did not request this, you can ignore this email.</p>
            </div>
        `,
    });

    return true;
};

module.exports = {
    sendWelcomeEmail,
    sendVerificationEmail,
    sendPasswordResetEmail,
};
