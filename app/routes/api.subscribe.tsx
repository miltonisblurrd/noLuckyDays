import {json, type ActionFunctionArgs} from '@shopify/remix-oxygen';

export async function action({request, context}: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({success: false, error: 'Method not allowed'}, {status: 405});
  }

  try {
    const {email, phone} = await request.json();

    if (!email || !phone) {
      return json({success: false, error: 'Email and phone are required'}, {status: 400});
    }

    // Get Omnisend API key from environment
    const OMNISEND_API_KEY = context.env.OMNISEND_API_KEY;

    if (!OMNISEND_API_KEY) {
      console.error('OMNISEND_API_KEY not configured');
      // Still allow access even if Omnisend isn't configured
      return json({success: true, message: 'Subscribed successfully'});
    }

    // Format phone number (ensure it has country code)
    let formattedPhone = phone.replace(/\D/g, '');
    if (!formattedPhone.startsWith('1') && formattedPhone.length === 10) {
      formattedPhone = '1' + formattedPhone; // Add US country code
    }
    formattedPhone = '+' + formattedPhone;

    // Send to Omnisend Contacts API
    const omnisendResponse = await fetch('https://api.omnisend.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': OMNISEND_API_KEY,
      },
      body: JSON.stringify({
        identifiers: [
          {
            type: 'email',
            id: email,
            channels: {
              email: {
                status: 'subscribed',
                statusDate: new Date().toISOString(),
              },
            },
          },
          {
            type: 'phone',
            id: formattedPhone,
            channels: {
              sms: {
                status: 'subscribed',
                statusDate: new Date().toISOString(),
              },
            },
          },
        ],
        tags: ['early-access', 'gate-signup'],
      }),
    });

    if (!omnisendResponse.ok) {
      const errorData = await omnisendResponse.text();
      console.error('Omnisend API error:', errorData);
      // Still allow access even if Omnisend fails
      return json({success: true, message: 'Subscribed successfully'});
    }

    return json({success: true, message: 'Subscribed successfully'});
  } catch (error) {
    console.error('Subscribe error:', error);
    // Still allow access even on error
    return json({success: true, message: 'Subscribed successfully'});
  }
}

// Handle GET requests (return method not allowed)
export async function loader() {
  return json({error: 'Method not allowed'}, {status: 405});
}

