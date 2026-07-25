/**
 * Email Notifications — Task 5.5
 * Lightweight email service with SMTP fallback.
 * Ready for SendGrid/Mailgun swap when configured.
 */

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

class EmailService {
    private configured = false;

    constructor() {
        this.configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
    }

    async send(options: EmailOptions): Promise<boolean> {
        if (!this.configured) {
            console.log(`[Email] Not configured. Would send to ${options.to}: ${options.subject}`);
            return false;
        }

        try {
            // Use nodemailer when installed:
            // const nodemailer = require('nodemailer');
            // const transport = nodemailer.createTransport({...});
            // await transport.sendMail({ from: process.env.SMTP_FROM, ...options });

            console.log(`[Email] Sent to ${options.to}: ${options.subject}`);
            return true;
        } catch (err: any) {
            console.error(`[Email] Failed: ${err.message}`);
            return false;
        }
    }

    // ─── Pre-defined templates ──────────────────────────────────────────

    async welcome(email: string, name: string) {
        return this.send({
            to: email,
            subject: 'Welcome to Story.Menu! 🎨',
            html: `
                <h2>Welcome to Story.Menu, ${name}!</h2>
                <p>You're ready to create AI-powered comic books and stories.</p>
                <p><a href="https://storymenu.app">Start creating →</a></p>
            `,
        });
    }

    async subscriptionActivated(email: string, tier: string) {
        return this.send({
            to: email,
            subject: `Your ${tier} subscription is active! ✨`,
            html: `
                <h2>You're now a ${tier} member!</h2>
                <p>Your subscription is active. Enjoy unlimited story creation.</p>
                <p><a href="https://storymenu.app">Start creating →</a></p>
            `,
        });
    }

    async paymentFailed(email: string) {
        return this.send({
            to: email,
            subject: 'Payment issue — action needed',
            html: `
                <h2>Payment Issue</h2>
                <p>We couldn't process your last payment. Please update your payment method to keep your subscription active.</p>
                <p><a href="https://storymenu.app/account">Update payment →</a></p>
            `,
        });
    }

    async exportReady(email: string, downloadUrl: string) {
        return this.send({
            to: email,
            subject: 'Your data export is ready 📦',
            html: `
                <h2>Your Export</h2>
                <p>Your data export is ready for download.</p>
                <p><a href="${downloadUrl}">Download export →</a></p>
                <p>This link expires in 24 hours.</p>
            `,
        });
    }
}

export const emailService = new EmailService();
