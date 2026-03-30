import React from 'react';
import { Link } from 'react-router-dom';
import { BrandsmithLogo } from './SharedComponents';

const Layout = ({ children, title, updated }) => (
  <div className="min-h-screen bg-[#080808] text-white p-6 md:p-12 animate-in fade-in">
    <div className="max-w-[800px] mx-auto">
      <Link to="/" className="flex items-center gap-2 text-[#4a4a4a] hover:text-white transition-all mb-12 text-[10px] font-bold uppercase tracking-widest mono">
        ← Back to home
      </Link>
      
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-syne">{title}</h1>
        <p className="text-[#4a4a4a] text-xs mono">Last updated: {updated}</p>
      </div>

      <div className="space-y-12">
        {children}
      </div>

      <div className="mt-24 pt-12 border-t border-[#1c1c1c] text-center">
        <div className="flex justify-center mb-6">
          <BrandsmithLogo size={24} />
        </div>
        <p className="text-[#4a4a4a] text-[10px] mono">© 2026 Brandsmither · Forge your brand</p>
      </div>
    </div>
  </div>
);

const Section = ({ label, children }) => (
  <div className="space-y-4">
    <label className="text-[10px] font-bold text-[#4a4a4a] uppercase tracking-widest mono">{label}</label>
    <div className="text-sm text-[#a0a0a0] leading-relaxed space-y-4 font-dm">
      {children}
    </div>
  </div>
);

export function PrivacyPage() {
  return (
    <Layout title="Privacy Policy" updated="March 2026">
      <Section label="Information We Collect">
        <p>We collect information that you provide directly to us when you create an account, build a brand kit, or communicate with us. This includes your name, email address, password, and any brand-related data (names, ideas, colors, logos) that you create or upload to the platform.</p>
      </Section>

      <Section label="How We Use Your Information">
        <p>We use the information we collect to operate, provide, maintain, and improve Brandsmither. This includes personalizing your experience, processing your brand kit exports, and sending you technical notices, updates, security alerts, and support messages.</p>
      </Section>

      <Section label="Data Storage">
        <p>Your data is stored securely using Supabase (a backend-as-a-service provider). We implement industry-standard security measures to protect your personal information. We never sell or share your personal data with third parties for marketing purposes.</p>
      </Section>

      <Section label="Cookies">
        <p>We use only essential cookies that are necessary for the operation of our service. These include session and authentication cookies to keep you logged in and secure your account as you navigate the platform.</p>
      </Section>

      <Section label="Your Rights">
        <p>You have the right to access, update, or delete your personal information at any time. You can manage your profile details in your settings or request complete account and data deletion by contacting us directly.</p>
      </Section>

      <Section label="Contact">
        <p>If you have any questions about this Privacy Policy, please contact us at <a href="mailto:brandsmither@gmail.com" className="text-white hover:underline">brandsmither@gmail.com</a>.</p>
      </Section>
    </Layout>
  );
}

export function TermsPage() {
  return (
    <Layout title="Terms of Service" updated="March 2026">
      <Section label="Acceptance">
        <p>By accessing or using Brandsmither, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our service.</p>
      </Section>

      <Section label="Beta Service">
        <p>Brandsmither is currently in Beta. You acknowledge that features may change, bugs may exist, and service availability is not guaranteed. We will not be liable for any loss of data or service interruptions during the beta period.</p>
      </Section>

      <Section label="Free Plan">
        <p>The Starter plan is free forever and is currently limited to 2 active brands per account. We reserve the right to modify the features and limitations of the free plan as the platform evolves.</p>
      </Section>

      <Section label="Pro Plan">
        <p>Brandsmither Pro is coming soon at $12/month or $99/year. Detailed terms for the subscription will be provided and updated when the payment processing system is launched.</p>
      </Section>

      <Section label="Your Content">
        <p>You own all brand content (names, logos, identity kits, business plans) that you create on Brandsmither. By using the service, you grant us a worldwide, non-exclusive license to store and process your content solely for the purpose of providing the service to you.</p>
      </Section>

      <Section label="Prohibited Use">
        <p>You agree not to use Brandsmither for any illegal purpose, spamming, abuse, or any activity that interferes with the platform's operation. You may not attempt to reverse engineer, scrape, or extract unauthorized data from the service.</p>
      </Section>

      <Section label="Termination">
        <p>We reserve the right to suspend or terminate your account at our sole discretion, without notice, for behavior that violates these Terms or is otherwise harmful to other users or the service.</p>
      </Section>

      <Section label="Contact">
        <p>For support or legal inquiries, please reach out to <a href="mailto:brandsmither@gmail.com" className="text-white hover:underline">brandsmither@gmail.com</a>.</p>
      </Section>
    </Layout>
  );
}
