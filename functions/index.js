const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.setSubscriberRole = functions.auth.user().onCreate(async (user) => {
  await admin.auth().setCustomUserClaims(user.uid, { role: 'subscriber' });

  return {
    message: `Success! ${user.email} has been made a subscriber.`
  };
});

exports.grantAdminRole = functions.https.onCall(async (data, context) => {
  // Ensure the user making the request is an admin.
  if (context.auth.token.role !== 'admin') {
    return { 
      error: 'Only admins can grant admin access.' 
    };
  }

  const { email } = data;
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
    return { 
      message: `Success! ${email} has been made an admin.` 
    };
  } catch (error) {
    return { error: error.message };
  }
});
