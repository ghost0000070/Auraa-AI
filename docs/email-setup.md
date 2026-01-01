# Email Setup Guide

This guide explains how to configure email functionality for Auraa AI.

## Overview

Auraa AI uses Firebase Functions to send transactional emails such as:
- Welcome emails when users sign up
- Password reset emails

## Prerequisites

- A Firebase project with Functions enabled
- An SMTP email service (e.g., Gmail, SendGrid, Mailgun, AWS SES)
- Firebase CLI installed

## Configuration

### 1. Get SMTP Credentials

You'll need the following information from your email service provider:

- **EMAIL_HOST**: SMTP server hostname (e.g., `smtp.gmail.com`)
- **EMAIL_PORT**: SMTP server port (typically `465` for SSL or `587` for TLS)
- **EMAIL_USER**: Your email username or address
- **EMAIL_PASS**: Your email password or app-specific password

### 2. Set Firebase Secrets

Use the Firebase CLI to set the email secrets. These are stored securely and accessed by Firebase Functions:

```bash
# Set the SMTP host
firebase functions:secrets:set EMAIL_HOST

# Set the SMTP port
firebase functions:secrets:set EMAIL_PORT

# Set the email username
firebase functions:secrets:set EMAIL_USER

# Set the email password
firebase functions:secrets:set EMAIL_PASS
```

When prompted, enter the corresponding value for each secret.

### 3. Deploy Functions

After setting the secrets, deploy your functions:

```bash
firebase deploy --only functions
```

## Provider-Specific Setup

### Gmail

1. Enable 2-factor authentication on your Google account
2. Generate an App Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated password
3. Use these settings:
   - EMAIL_HOST: `smtp.gmail.com`
   - EMAIL_PORT: `465`
   - EMAIL_USER: Your Gmail address
   - EMAIL_PASS: The app password you generated

### SendGrid

1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key in the SendGrid dashboard
3. Use these settings:
   - EMAIL_HOST: `smtp.sendgrid.net`
   - EMAIL_PORT: `465`
   - EMAIL_USER: `apikey` (literal string)
   - EMAIL_PASS: Your SendGrid API key

### AWS SES

1. Set up Amazon SES and verify your domain/email
2. Create SMTP credentials in the SES console
3. Use these settings:
   - EMAIL_HOST: Your SES SMTP endpoint (e.g., `email-smtp.us-east-1.amazonaws.com`)
   - EMAIL_PORT: `465`
   - EMAIL_USER: Your SMTP username
   - EMAIL_PASS: Your SMTP password

## Testing

After deployment, test the email functionality:

1. Sign up a new user account
2. Check if the welcome email is received
3. Test password reset functionality

## Troubleshooting

### Emails not sending

- Verify all secrets are set correctly: `firebase functions:secrets:access EMAIL_HOST`
- Check function logs: `firebase functions:log`
- Ensure your email provider allows SMTP access
- Check spam/junk folders

### Authentication errors

- Verify EMAIL_USER and EMAIL_PASS are correct
- For Gmail, ensure you're using an app password, not your regular password
- Check if your email provider requires additional security settings

### Connection errors

- Verify EMAIL_HOST and EMAIL_PORT are correct
- Ensure your Firebase Functions can make outbound connections
- Some providers require IP whitelisting

## Security Best Practices

- Never commit email credentials to version control
- Use Firebase Secrets to store sensitive information
- Rotate credentials periodically
- Use app-specific passwords when available
- Monitor email sending for suspicious activity

## Customization

To customize email templates, edit the `sendWelcomeEmail` function in `functions/src/index.ts`:

```typescript
await transporter.sendMail({
    from: '"Auraa AI" <no-reply@auraa-ai.com>',
    to: email,
    subject: "Welcome to Auraa AI!",
    html: `<!-- Your custom HTML here -->`,
});
```

## Additional Resources

- [Nodemailer Documentation](https://nodemailer.com/)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env#secret-manager)
- [Firebase Functions Logs](https://firebase.google.com/docs/functions/writing-and-viewing-logs)
