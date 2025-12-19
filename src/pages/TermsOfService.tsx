import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>Last Updated: [Date]</strong></p>

          <h2 className="text-xl font-semibold">1. Agreement to Terms</h2>
          <p>By using our application, Auraa, you agree to be bound by these Terms of Service. If you do not agree to these Terms, do not use the Application.</p>

          <h2 className="text-xl font-semibold">2. Intellectual Property Rights</h2>
          <p>Unless otherwise indicated, the Application is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Application (collectively, the “Content”) and the trademarks, service marks, and logos contained therein (the “Marks”) are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.</p>

          <h2 className="text-xl font-semibold">3. User Representations</h2>
          <p>By using the Application, you represent and warrant that:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>All registration information you submit will be true, accurate, current, and complete.</li>
            <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
            <li>You have the legal capacity and you agree to comply with these Terms of Service.</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Prohibited Activities</h2>
          <p>You may not access or use the Application for any purpose other than that for which we make the Application available. The Application may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.</p>

          <h2 className="text-xl font-semibold">5. Governing Law</h2>
          <p>These Terms of Service and your use of the Application are governed by and construed in accordance with the laws of the State of [Your State], without regard to its conflict of law principles.</p>

          <h2 className="text-xl font-semibold">6. Contact Us</h2>
          <p>To resolve a complaint regarding the Application or to receive further information regarding use of the Application, please contact us at: [Contact Information]</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfService;
