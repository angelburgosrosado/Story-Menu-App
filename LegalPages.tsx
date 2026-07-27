import React from 'react';
import { Helmet } from 'react-helmet-async';

interface LegalPageProps {
    title: string;
    lastUpdated: string;
    children: React.ReactNode;
}

const LegalPageLayout = ({ title, lastUpdated, children }: LegalPageProps) => {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-slate-800 dark:text-slate-200">
            <Helmet>
                <title>{title} | Story.Menu</title>
            </Helmet>
            <h1 className="text-4xl font-extrabold mb-4">{title}</h1>
            <p className="text-sm opacity-60 mb-12">Last Updated: {lastUpdated}</p>
            <div className="prose prose-slate dark:prose-invert max-w-none">
                {children}
            </div>
        </div>
    );
};

export const PrivacyPolicy = () => {
    return (
        <LegalPageLayout title="Privacy Policy" lastUpdated="June 17, 2026">
            <p className="lead">At Story.Menu, your privacy is a top priority. This Privacy Policy explains how we collect, use, and protect your personal information.</p>
            <h3>1. Information We Collect</h3>
            <p>We may collect information you provide directly to us (e.g., account details, prompt inputs) and data collected automatically (e.g., cookies, usage analytics).</p>
            <h3>2. How We Use Your Information</h3>
            <p>Your data is used to provide, improve, and personalize our services, including AI generation features, and to ensure security and compliance.</p>
            <h3>3. Data Sharing and Disclosure</h3>
            <p>We do not sell your personal data. We may share data with trusted third-party service providers (such as AI model hosts) strictly for operational purposes.</p>
            <h3>4. Your Rights</h3>
            <p>You have the right to access, update, or delete your personal data. Please contact us to exercise these rights.</p>
            <p><em>Note: This is a placeholder policy. A fully compliant Privacy Policy tailored to GDPR, CCPA, and other relevant jurisdictions must be drafted by legal counsel.</em></p>
        </LegalPageLayout>
    );
};

export const TermsOfService = () => {
    return (
        <LegalPageLayout title="Terms of Service" lastUpdated="June 17, 2026">
            <p className="lead">Welcome to Story.Menu. By using our application, you agree to these Terms of Service.</p>
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using our service, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>
            <h3>2. User Content and AI Generation</h3>
            <p>You retain ownership of the prompts you submit. However, AI-generated outputs are subject to specific licensing conditions depending on your tier.</p>
            <h3>3. Acceptable Use</h3>
            <p>You agree not to use the service for any unlawful purposes, or to generate harmful, abusive, or explicitly illegal content.</p>
            <h3>4. Token Sales and Refunds</h3>
            <p>Tokens purchased are non-refundable unless required by law. Token prices are subject to change.</p>
            <p><em>Note: This is a placeholder. Official Terms of Service should be reviewed by legal counsel.</em></p>
        </LegalPageLayout>
    );
};

export const CookiePolicy = () => {
    return (
        <LegalPageLayout title="Cookie Policy" lastUpdated="June 17, 2026">
            <p className="lead">This Cookie Policy explains how and why we use cookies and similar technologies on Story.Menu.</p>
            <h3>What Are Cookies?</h3>
            <p>Cookies are small text files placed on your device to help the site provide a better user experience.</p>
            <h3>How We Use Cookies</h3>
            <p>We use essential cookies to maintain your session and preferences (e.g., dark/light mode, language). We may also use analytics cookies to understand how our site is used.</p>
            <h3>Managing Cookies</h3>
            <p>You can control and/or delete cookies as you wish through your browser settings. Disabling essential cookies may affect the functionality of the site.</p>
        </LegalPageLayout>
    );
};

export const DMCA = () => {
    return (
        <LegalPageLayout title="Copyright / DMCA Policy" lastUpdated="June 17, 2026">
            <p className="lead">We respect the intellectual property rights of others and expect our users to do the same.</p>
            <h3>Reporting Copyright Infringement</h3>
            <p>If you believe that your work has been copied in a way that constitutes copyright infringement, please provide our Copyright Agent with the necessary information as required by the Digital Millennium Copyright Act (DMCA).</p>
            <h3>Counter-Notice</h3>
            <p>If you believe your content was removed by mistake or misidentification, you may file a counter-notice.</p>
            <p><em>Contact: legal@story.menu</em></p>
        </LegalPageLayout>
    );
};

export const LegalPages = {
    PrivacyPolicy,
    TermsOfService,
    CookiePolicy,
    DMCA
};
