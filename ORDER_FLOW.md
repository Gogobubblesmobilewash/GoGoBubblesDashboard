# Order Flow Implementation

## Overview

This document explains the comprehensive order flow implementation that separates orders and jobs into distinct processes with service-specific rules, perks, and photo requirements.

## Service Structure and Rules

### 1️⃣ Mobile Car Wash
- **Tiers**: Express Shine, Signature Shine, Supreme Shine
- **Vehicle Types**: Car, SUV, Truck, Minivan
- **Add-ons**: Clay Bar Treatment, Bug & Tar Removal, Plastic Trim Restoration, Upholstery Shampoo, Interior Shampoo
- **Max Vehicles per Order**: 3
- **Perks Logic**:
  - First-time any car wash (including Express) → free car freshener
  - Signature or Supreme always get a freshener on every booking
- **Photo Requirements**: Interior Shampoo, Upholstery Shampoo

### 2️⃣ Home Cleaning
- **Tiers**: Refresh Clean, Signature Deep Clean
- **Add-ons**: Deep Dusting, Deep Clean Bedroom, Refrigerator Cleaning, Oven Cleaning, Freezer Cleaning, Carpet Cleaning, Steam Mopping
- **Perks Logic**:
  - Signature Deep Clean → free candle every booking
  - Every third Refresh Clean → free candle
- **Photo Requirements**: Signature Deep Clean

### 3️⃣ Laundry Service
- **Always treated as one job**, even if multiple bags
- **Bag Types**: Essentials Bag, Family Bag, Delicates Bag, Ironing Bag
- **Add-ons**: Eco-friendly detergent, Same-day service
- **Photo Logic**: **MANDATORY** 2 photos required (pickup, delivery)
- **QR Tracking**: Individual bag scanning for pickup and delivery
- **Perk rules**: None — but maintain required photos and QR tracking

### 4️⃣ General Rules
- Orders with multiple services split into separate jobs (except laundry which stays together)
- Each job gets a unique Job ID (JOB-####)
- Each order gets a unique Order ID (ORDER-####)
- All jobs stay in the dashboard until marked Completed
- Status flows: Pending → Assigned → Progressing → Completed
- If declined, reset to Pending
- Cancelled if manually cancelled

## Flow Diagram

```
Formspree → Orders Sheet → Split Orders → Jobs Sheet → Assign to Bubblers → Complete
```

## Detailed Process

### 1. Incoming Orders
- **Source**: Formspree forms
- **Destination**: Orders sheet (GoGoBubbles Booking tab)
- **Data**: Date, Address, Email, Phone, Services, Subtotal, Tax, Total, etc.
- **Status**: All new orders land here first

### 2. Order Processing
- **Location**: Orders Management tab in dashboard
- **Purpose**: Review and process incoming orders
- **Actions**:
  - View all active orders (not completed/cancelled)
  - Split multi-service orders into individual jobs
  - Complete or cancel orders
  - View detailed order information

### 3. Order Splitting
- **Trigger**: Admin clicks "Split Jobs" on multi-service orders
- **Action**: `splitOrder` API call creates separate job records
- **Result**: 
  - Original order stays in Orders sheet with "Split Completed" status
  - Individual jobs created in Jobs sheet with JOB-#### IDs
  - Each job represents one service from the original order
  - Laundry services are grouped into one job regardless of bag count

### 4. Job Management
- **Location**: Jobs Management tab in dashboard
- **Purpose**: Assign jobs to bubblers and track progress
- **Actions**:
  - Admin: Assign jobs to bubblers
  - Bubblers: Accept/decline assignments, mark arrival, complete jobs
  - Status tracking: Pending → Assigned → Progressing → Completed
  - Display service details, tiers, add-ons, perks, and photo requirements

### 5. Order Completion
- **Trigger**: All jobs from an order are completed
- **Action**: Order is marked as "Completed" in Orders sheet
- **Result**: Order is hidden from active orders view

## Key Features

### Orders Management
- ✅ Shows only active orders (not completed/cancelled)
- ✅ Detects multi-service orders automatically
- ✅ Provides split functionality for multi-service orders
- ✅ Links to Jobs tab for split orders
- ✅ Hides orders only when completed
- ✅ Displays service details with tiers and add-ons
- ✅ Shows order details in expandable modal
- ✅ Error handling with retry functionality

### Jobs Management
- ✅ Shows jobs created from split orders
- ✅ Admin can assign jobs to bubblers
- ✅ Bubblers can accept/decline/complete jobs
- ✅ Full status tracking workflow
- ✅ Links back to Orders tab
- ✅ Displays service-specific details
- ✅ Shows perks and photo requirements
- ✅ Error handling with retry functionality
- ✅ **QR Scanning for Laundry**: Pickup and delivery bag tracking
- ✅ **Bag Progress Tracking**: Real-time X/Y bag scanning progress
- ✅ **Scan History**: Complete audit trail of all bag scans
- ✅ **Data Protection**: Customer information protected after completion
- ✅ **Privacy Policy**: Automatic masking of sensitive data
- ✅ **Completion Statistics**: Performance tracking without sensitive data

### Service-Specific Features
- ✅ **Mobile Car Wash**: Vehicle types, tiers, add-ons, perks
- ✅ **Home Cleaning**: Tiers, add-ons, perks
- ✅ **Laundry Service**: Bag types, grouped jobs, photo requirements, **QR bag tracking**
- ✅ **Perks**: Automatic detection and display
- ✅ **Photo Requirements**: Clear indication of required photos

### Data Separation
- ✅ Orders sheet: Master intake and order tracking
- ✅ Jobs sheet: Dispatch and job tracking
- ✅ Clear separation of concerns
- ✅ Proper data flow between systems

## API Endpoints Used

### Orders API
- `getAllOrders()` - Fetch orders from Orders sheet
- `splitOrder(orderId)` - Split multi-service order into jobs
- `completeOrder(orderId)` - Mark order as completed
- `cancelOrder(orderId)` - Cancel order

### Jobs API
- `getAllJobs()` - Fetch all jobs (admin)
- `getJobsByBubbler(email)` - Fetch jobs for specific bubbler
- `assignJob(jobId, bubblerEmail, bubblerName)` - Assign job to bubbler
- `acceptJob(jobId, bubblerEmail)` - Bubbler accepts job
- `declineJob(jobId, bubblerEmail)` - Bubbler declines job
- `markArrival(jobId, bubblerEmail)` - Bubbler marks arrival
- `completeJob(jobData)` - Complete job with photos/notes

## Status Flow

### Order Statuses
- `Pending` - New order, needs processing
- `Split Completed` - Order split into jobs
- `Completed` - All jobs completed, order finished
- `Cancelled` - Order cancelled

### Job Statuses
- `Pending` - Job created, waiting for assignment
- `Assigned` - Job assigned to bubbler
- `Accepted` - Bubbler accepted job
- `Declined` - Bubbler declined job (resets to Pending)
- `Progressing` - Bubbler marked arrival
- `Completed` - Job completed
- `Cancelled` - Job cancelled

## User Roles

### Admin
- View all orders and jobs
- Split multi-service orders
- Assign jobs to bubblers
- Complete/cancel orders
- Manage job assignments
- View service details, perks, and photo requirements

### Bubbler
- View assigned jobs only
- Accept/decline job assignments
- Mark arrival at job location
- Complete jobs with photos/notes
- See perks and photo requirements for their jobs

## UI Components

### Order Cards
- Service icons (Car, Home, Package)
- Service details with tiers and add-ons
- Order status indicators
- Split/View Jobs buttons
- Details modal with full order information

### Job Cards
- Service icons and details
- Tier and add-on display
- Perks with gift icon
- Photo requirements with camera icon
- Status-based action buttons
- Bag information for laundry

### Error Handling
- Error messages displayed on dashboard
- Retry functionality for failed operations
- Clear error states with dismiss options

## QR Scanning for Laundry Service

### Bag Tracking System
- **Pickup Scanning**: Scan each laundry bag during pickup
- **Delivery Scanning**: Scan each laundry bag during delivery
- **Progress Tracking**: Real-time tracking of scanned bags vs total bags
- **Automatic Completion**: System tracks when all bags are scanned

### QR Scan Features
- **Individual Bag Scanning**: Each bag has a unique QR code
- **Progress Display**: Shows X/Y bags scanned for pickup and delivery
- **Scan History**: All scans are recorded with timestamp and location
- **Error Handling**: Robust error handling with retry logic
- **User Feedback**: Clear success/error messages for each scan

### QR Scan Data Structure
```javascript
{
  jobId: "string",
  orderId: "string", 
  customerName: "string",
  bagId: "string", // QR code content
  scanType: "pickup" | "delivery",
  bubblerEmail: "string",
  bubblerName: "string",
  timestamp: "ISO string",
  location: "string"
}
```

### QR Scanning & Photo Workflow
1. **Job Assignment**: Laundry job assigned to bubbler
2. **Pickup Phase**: 
   - Bubbler clicks "Scan Pickup" button
   - QR scanner opens with pickup instructions
   - Scan each bag individually
   - System tracks progress (X/Y bags)
   - **MANDATORY**: Upload pickup photo showing all bags at location
   - All bags scanned + photo uploaded = pickup complete
3. **Processing Phase**: Bags processed at facility
4. **Delivery Phase**:
   - Bubbler clicks "Scan Delivery" button  
   - QR scanner opens with delivery instructions
   - Scan each bag individually
   - System tracks progress (X/Y bags)
   - **MANDATORY**: Upload delivery photo showing all bags at location
   - All bags scanned + photo uploaded = delivery complete
5. **Job Completion**: Job can only be completed when both photos are uploaded

### QR Scanner UI Features
- **Context Information**: Shows customer, service, bag count, progress
- **Clear Instructions**: Step-by-step scanning instructions
- **Progress Display**: Real-time progress counter
- **Success Feedback**: Confirmation for each successful scan
- **Completion Alert**: Notification when all bags scanned
- **Error Handling**: Clear error messages and retry options

### Photo Requirements UI Features
- **Visual Status Indicators**: Green/red indicators for photo upload status
- **Mandatory Photo Buttons**: Separate buttons for pickup and delivery photos
- **Photo Upload Modal**: Dedicated modal with clear instructions
- **Completion Validation**: Prevents job completion without required photos
- **Photo Requirements Display**: Clear indication of required photos on job cards

### QR API Endpoints
- `addScan(scanData)` - Record a new bag scan
- `getScansByBubbler(bubblerEmail)` - Get all scans for a bubbler
- `getAllScans()` - Get all scans (admin)
- `getScanHistory(customerName)` - Get scan history for customer

## Data Protection & Privacy Policy

### Customer Information Protection
- **Active Jobs**: Full customer information visible to assigned bubbler
- **Protected Jobs**: Customer information automatically protected for:
  - Completed jobs
  - Cancelled jobs
  - Declined jobs
  - Reassigned jobs (assigned to different bubbler)
- **Protected Data**: Customer name, address, phone, email, notes
- **Retained Data**: Job metadata, earnings, service details, photos for audit

### Privacy Implementation
- **Automatic Protection**: Customer data masked for protected job statuses
- **Protected Statuses**: Completed, Cancelled, Declined, Reassigned
- **Visual Indicators**: Privacy notices on protected job cards
- **Admin Access**: Full data access maintained for administrators
- **Statistics Only**: Bubblers see job counts and earnings only

### Data Retention Policy
- **Job Metadata**: Retained indefinitely for statistics and audit
- **Customer Data**: Protected after completion, accessible only to admin
- **Photo Links**: Retained for audit purposes
- **QR Scan Data**: Retained for tracking and audit purposes

### Privacy Features
- **Job Statistics**: Bubblers see counts for all job statuses (completed, cancelled, declined, reassigned)
- **Earnings Tracking**: Total earnings from completed jobs only
- **Service Breakdown**: Statistics by service type for completed jobs
- **Protected Display**: "*** PROTECTED ***" for sensitive information
- **Privacy Notices**: Clear indicators on protected job cards with status-specific messages

## Benefits

1. **Clear Separation**: Orders and jobs are distinct entities
2. **Better Tracking**: Each service gets its own job record
3. **Improved Workflow**: Logical progression from order to job completion
4. **Data Integrity**: Orders remain as master records
5. **Scalability**: Easy to add new job types or modify workflow
6. **Service-Specific Logic**: Perks and photo requirements handled automatically
7. **Enhanced UX**: Clear visual indicators for all service details
8. **Error Resilience**: Proper error handling and retry mechanisms 