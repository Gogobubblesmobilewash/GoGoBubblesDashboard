# Manual Link Generator - Admin Guide

## 🎯 Overview

The Manual Link Generator allows admins and support bubblers to create personalized feedback links for customers with multi-service orders. This tool ensures each service gets its own feedback link with the correct bubbler information.

## 🚀 How to Access

1. **Login to Admin Dashboard**
2. **Navigate to:** `/manual-link-generator`
3. **Required Role:** `admin_bubbler` or `support_bubbler`

## 📋 Step-by-Step Workflow

### Step 1: Filter Orders
- **Date Range:** Select from 24 hours to 90 days
- **Search:** Enter customer name or Order ID
- **Refresh:** Click to load latest orders

### Step 2: Select Order & Service
1. **Choose Order:** Dropdown shows `#OrderID - Customer Name - Date`
2. **Select Service:** Choose specific service from that order
3. **Bubbler Auto-fills:** Shows assigned bubbler automatically

### Step 3: Configure Options
- ✅ **Include Tip Prompt:** Adds `&tip=true` to link
- ✅ **Mark as Sent:** Internal tracking checkbox

### Step 4: Generate & Copy
- **Feedback Link:** Auto-generated with all parameters
- **Copy Link:** One-click copy to clipboard
- **Email Preview:** Pre-formatted email text
- **Copy Email:** Copy complete email text

## 🔗 Generated Link Format

```
https://gogobubbles.com/feedback.html?order_id=abc123&bubbler_id=xyz456&serviceType=Home%20Cleaning&tip=true
```

### Parameters Included:
- `order_id`: Customer's order ID
- `bubbler_id`: Assigned bubbler's ID
- `serviceType`: Service type (URL encoded)
- `tip`: Optional tip prompt flag

## 📧 Email Preview Template

The system generates personalized email text:

```
Hi [Customer Name],

Thank you for choosing GoGoBubbles for your [Service Type] service!

We'd love to hear about your experience with [Bubbler Name]. Your feedback helps us improve and ensures our bubblers get the recognition they deserve.

Please take a moment to rate your service:
[Generated Link]

What you can do:
• Rate your experience (1-5 stars)
• Leave comments about the service
• Tip your bubbler (optional)

Your feedback is completely anonymous to the bubbler, but helps us maintain quality standards.

Thank you for choosing GoGoBubbles!

Best regards,
The GoGoBubbles Team
```

## 📊 Batch Export Feature

### CSV Export Includes:
- Order ID
- Customer Name
- Customer Email
- Service Type
- Assigned Bubbler
- Generated Feedback Link
- Order Date

### Use Cases:
- **Follow-up Campaigns:** Export all links for email marketing
- **Customer Service:** Quick access to feedback links
- **Analytics:** Track feedback link generation

## 🔐 Security & Permissions

### Access Control:
- **Admin Bubblers:** Full access
- **Support Bubblers:** Full access
- **Other Roles:** No access (hidden from UI)

### Data Protection:
- **RLS Policies:** Only authorized users can view order data
- **Audit Trail:** All link generation is logged
- **Secure Links:** Links include encrypted parameters

## 🎯 Use Cases

### 1. **Multi-Service Orders**
```
Order #12345: Home Cleaning + Car Wash
→ Generate separate links for each service
→ Each link pre-fills correct bubbler
```

### 2. **Follow-up Campaigns**
```
Export CSV of recent orders
→ Import to email marketing platform
→ Send personalized feedback requests
```

### 3. **Customer Service**
```
Customer calls about feedback
→ Search by name/order ID
→ Generate fresh link instantly
→ Send via email/SMS
```

### 4. **Quality Assurance**
```
Lead bubblers need feedback links
→ Generate for specific services
→ Include tip prompts for exceptional service
```

## 🛠️ Technical Details

### Database Tables Used:
- `orders`: Customer and order information
- `order_service`: Service details per order
- `job_assignments`: Bubbler assignments
- `bubblers`: Bubbler information

### API Endpoints:
- `GET /api/orders`: Fetch order data
- `POST /api/send-feedback-emails`: Send automated emails

### RLS Policies:
- `admin_support_can_read_orders`
- `admin_support_can_read_order_service`
- `admin_support_can_read_job_assignments`
- `admin_support_can_read_bubblers`

## 🚨 Troubleshooting

### Common Issues:

**1. No Orders Loading**
- Check date range filter
- Verify admin/support role
- Refresh browser cache

**2. Missing Bubbler Info**
- Job may not be assigned yet
- Check job_assignments table
- Verify bubbler is active

**3. Link Not Working**
- Check URL encoding
- Verify feedback.html exists
- Test parameters manually

**4. Email Preview Empty**
- Ensure order and service selected
- Check customer name exists
- Verify bubbler assignment

## 📈 Best Practices

### 1. **Timing**
- Send feedback requests 1-2 hours after service
- Avoid sending during peak hours
- Consider customer timezone

### 2. **Personalization**
- Always include bubbler name
- Reference specific service type
- Use customer's preferred name

### 3. **Follow-up**
- Track which links are clicked
- Send reminders for unopened links
- Monitor feedback completion rates

### 4. **Quality Control**
- Review generated links before sending
- Test links in incognito mode
- Verify pre-fill data accuracy

## 🔄 Integration with Other Systems

### Automated Email System:
- Links can be sent via `/api/send-feedback-emails`
- Integrates with email service providers
- Tracks email status and opens

### Feedback Form:
- Links pre-fill customer and service data
- Supports tipping functionality
- Maintains anonymous feedback

### Analytics Dashboard:
- Track link generation metrics
- Monitor feedback completion rates
- Analyze customer satisfaction trends

## 📞 Support

For technical issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Contact system administrator
4. Check Supabase logs for database issues

---

**Last Updated:** [Current Date]
**Version:** 1.0
**Maintained By:** GoGoBubbles Development Team 