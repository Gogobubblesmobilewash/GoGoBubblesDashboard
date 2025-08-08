import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get pending feedback emails
    const { data: pendingEmails, error } = await supabase
      .from('pending_feedback_emails')
      .select('*')
      .eq('email_status', 'pending')
      .limit(10); // Process 10 at a time

    if (error) throw error;

    const results = [];

    for (const email of pendingEmails) {
      try {
        // Send email using your email service (Resend, SendGrid, etc.)
        const emailResult = await sendFeedbackEmail(email);
        
        // Update status in database
        await supabase
          .from('feedback_emails')
          .update({
            email_status: 'sent',
            email_sent_at: new Date().toISOString()
          })
          .eq('id', email.id);

        results.push({
          id: email.id,
          status: 'sent',
          customer_email: email.customer_email
        });

      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        
        // Update status to failed
        await supabase
          .from('feedback_emails')
          .update({
            email_status: 'failed'
          })
          .eq('id', email.id);

        results.push({
          id: email.id,
          status: 'failed',
          error: emailError.message
        });
      }
    }

    res.status(200).json({
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Error processing feedback emails:', error);
    res.status(500).json({ error: 'Failed to process feedback emails' });
  }
}

async function sendFeedbackEmail(emailData) {
  // Replace with your email service (Resend, SendGrid, etc.)
  const emailService = process.env.EMAIL_SERVICE || 'resend';
  
  const emailContent = generateFeedbackEmailContent(emailData);
  
  if (emailService === 'resend') {
    return await sendWithResend(emailData, emailContent);
  } else if (emailService === 'sendgrid') {
    return await sendWithSendGrid(emailData, emailContent);
  } else {
    // Default to console log for development
    console.log('Email would be sent:', {
      to: emailData.customer_email,
      subject: 'How was your GoGoBubbles service?',
      content: emailContent
    });
    return { success: true };
  }
}

function generateFeedbackEmailContent(emailData) {
  const bubblerName = `${emailData.bubbler_first_name} ${emailData.bubbler_last_name}`;
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://gogobubbles.com/logo.png" alt="GoGoBubbles" style="max-width: 200px;">
      </div>
      
      <h2 style="color: #1086bc;">How was your ${emailData.service_type} service?</h2>
      
      <p>Hi ${emailData.customer_name},</p>
      
      <p>We hope you enjoyed your recent ${emailData.service_type} service with ${bubblerName}!</p>
      
      <p>Your feedback helps us improve and ensures our bubblers get the recognition they deserve. It only takes a minute to share your experience.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${emailData.feedback_link}" 
           style="background: #4fd1c5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Rate Your Service
        </a>
      </div>
      
      <p><strong>What you can do:</strong></p>
      <ul>
        <li>Rate your experience (1-5 stars)</li>
        <li>Leave comments about the service</li>
        <li>Tip your bubbler (optional)</li>
      </ul>
      
      <p>Your feedback is completely anonymous to the bubbler, but helps us maintain quality standards.</p>
      
      <p>Thank you for choosing GoGoBubbles!</p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
        <p>This feedback link is specific to your ${emailData.service_type} service with ${bubblerName}.</p>
      </div>
    </div>
  `;
}

async function sendWithResend(emailData, content) {
  // Implementation for Resend
  const resend = require('resend')(process.env.RESEND_API_KEY);
  
  return await resend.emails.send({
    from: 'feedback@gogobubbles.com',
    to: emailData.customer_email,
    subject: 'How was your GoGoBubbles service?',
    html: content
  });
}

async function sendWithSendGrid(emailData, content) {
  // Implementation for SendGrid
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  return await sgMail.send({
    to: emailData.customer_email,
    from: 'feedback@gogobubbles.com',
    subject: 'How was your GoGoBubbles service?',
    html: content
  });
} 