# Email Configuration Setup

Auraa AI sends automated emails for:
- ✉️ Welcome emails when users sign up
- 🔑 Password reset emails (handled by Firebase Auth)
- 📧 Optional: Custom notifications (future feature)

## Setup Firebase Secrets for Email

### 1. Choose an Email Provider

**Option A: Gmail** (Easiest for testing)
- Create a Gmail account or use existing
- Enable 2-Factor Authentication
- Generate an App Password: https://myaccount.google.com/apppasswords
- Use these settings:
  - Host: `smtp.gmail.com`
  - Port: `465`
  - User: Your Gmail address
  - Pass: The app password (not your Gmail password)

**Option B: SendGrid** (Best for production)
- Sign up at https://sendgrid.com
- Create an API key
- Use these settings:
  - Host: `smtp.sendgrid.net`
  - Port: `465`
  - User: `apikey`
  - Pass: Your SendGrid API key

**Option C: AWS SES** (Most reliable)
- Set up SES in AWS Console
- Verify your domain
- Create SMTP credentials
- Use settings provided by AWS

### 2. Set Firebase Secrets

Run these commands in your terminal:

```bash
# Set email host (e.g., smtp.gmail.com)
firebase functions:secrets:set EMAIL_HOST

# Set email port (usually 465 for SSL)
firebase functions:secrets:set EMAIL_PORT

# Set email username (your email or API username)
firebase functions:secrets:set EMAIL_USER

# Set email password (app password or API key)
firebase functions:secrets:set EMAIL_PASS
```

When prompted, enter each value.

### 3. Deploy Functions

After setting secrets, deploy your functions:

```bash
firebase deploy --only functions
```

### 4. Test Email Functionality

1. Sign up a new test user
2. Check if welcome email arrives
3. Try password reset from login page
4. Check spam folder if emails don't arrive

## Troubleshooting

### Emails Not Sending

1. **Check Firebase Functions Logs**:
   ```bash
   firebase functions:log
   ```

2. **Verify Secrets Are Set**:
   ```bash
   firebase functions:secrets:access EMAIL_HOST
   ```

3. **Common Issues**:
   - **Gmail blocking**: For Gmail accounts, ensure 2FA is enabled and that you're using an App Password for SMTP access; if issues persist, consider using a dedicated provider like SendGrid or AWS SES instead of direct Gmail SMTP.
   - **Wrong port**: Try 587 instead of 465
   - **Firewall**: Ensure Cloud Functions can access SMTP ports
   - **Wrong credentials**: Double-check email/password

### Emails Going to Spam

- Set up SPF, DKIM, and DMARC records for your domain
- Use a verified domain email address (not gmail)
- Warm up your sending reputation gradually
- Use a dedicated email service (SendGrid, AWS SES)

## Security Best Practices

✅ **DO**:
- Use Firebase Secrets Manager for credentials
- Use app-specific passwords, not main account passwords
- Rotate credentials periodically
- Monitor for unusual sending patterns

❌ **DON'T**:
- Never commit email credentials to Git
- Don't use personal email for production
- Don't store passwords in environment variables
- Don't skip 2FA on email accounts

## Customizing Email Templates

Email templates are in `functions/src/index.ts`. To customize:

1. Edit the HTML in the `sendMail` call
2. Use your brand colors and logo
3. Test responsive design
4. Deploy changes: `firebase deploy --only functions`

## Future Enhancements

- 📨 Email verification reminders
- 📊 Weekly usage reports
- 🎉 Milestone celebration emails
- 📢 Feature announcement emails
- 🔔 AI employee task completion notifications
