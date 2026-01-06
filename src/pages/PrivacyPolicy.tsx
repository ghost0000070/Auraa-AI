import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>Last Updated: January 1, 2026</strong></p>
          
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p>Welcome to Auraa. We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our application. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.</p>

          <h2 className="text-xl font-semibold">2. Collection of Your Information</h2>
          <p>We may collect information about you in a variety of ways. The information we may collect via the Application includes:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, shipping address, email address, and telephone number, and demographic information, such as your age, gender, hometown, and interests, that you voluntarily give to us when you register with the Application.</li>
            <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Application, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Application.</li>
            <li><strong>Financial Data:</strong> Financial information, such as data related to your payment method (e.g., valid credit card number, card brand, expiration date) that we may collect when you purchase, order, return, exchange, or request information about our services from the Application. We store only very limited, if any, financial information that we collect. Otherwise, all financial information is stored by our payment processor, Polar.</li>
          </ul>

          <h2 className="text-xl font-semibold">3. Use of Your Information</h2>
          <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Create and manage your account.</li>
            <li>Email you regarding your account or order.</li>
            <li>Fulfill and manage purchases, orders, payments, and other transactions related to the Application.</li>
            <li>Generate a personal profile about you to make future visits to the Application more personalized.</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Contact Us</h2>
          <p>If you have questions or comments about this Privacy Policy, please contact us at: <a href="mailto:support@auraa-ai.com" className="text-primary hover:underline">support@auraa-ai.com</a></p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
