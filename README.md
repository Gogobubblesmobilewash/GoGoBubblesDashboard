# GoGoBubblesDashboard

A comprehensive dashboard application for GoGoBubbles field staff (Bubblers) and administrators to manage jobs, equipment, and operations.

## 🚀 Features

### Bubbler (Field Staff) View
- **Authentication**: Secure login with email/password, biometric support, password reset
- **Daily Assignments**: View and manage daily job assignments
- **Job Management**: Accept, decline, check-in, and complete jobs
- **Photo Upload**: Upload photos for jobs requiring documentation
- **QR Code Scanner**: Scan and track laundry bags and equipment
- **Equipment Tracking**: View assigned equipment and rental status
- **Earnings**: Track earnings and performance metrics
- **Profile Management**: View and edit personal information

### Admin View
- **Complete Access**: View all jobs, bubblers, equipment, ratings, and admin notes
- **Job Management**: Assign, reassign, cancel, and complete jobs
- **Equipment Management**: Track, assign, and manage all equipment
- **Earnings Management**: View and manage all earnings across the team
- **Feedback/Ratings**: View and respond to customer feedback
- **Admin Notes**: Add and view internal notes and communications
- **Analytics**: Performance metrics and team overview

## 🎨 Design & Branding

- **Fonts**: Poppins (primary), Inter (secondary)
- **Colors**: Aqua/blue gradients with bold, modern styling
- **Components**: Bold, rounded cards with shadows
- **Buttons**: Gradient, rounded, bold design with sticky CTAs
- **Logo**: GoGoBubbles/Bubbler branding throughout

## 🛠 Tech Stack

- **Frontend**: Vite + React + Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **QR Code**: qrcode.react
- **Backend**: Google Apps Script (API endpoints)
- **Data Storage**: Google Sheets

## 📊 Data Structure

### Google Sheets Tabs
1. **Jobs**: job id, bubbler name, service type, customer info, status, earnings
2. **QR Scans**: scan tracking for laundry bags and equipment
3. **Equipment**: item tracking, assignments, rental status
4. **Ratings**: customer feedback and ratings
5. **Admin Notes**: internal communications and notes

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bubbler-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Demo Credentials

**Bubbler Account:**
- Email: `bubbler1@gogobubbles.com`
- Password: `password123`

**Admin Account:**
- Email: `admin@gogobubbles.com`
- Password: `admin123`

## 🔧 Configuration

### Google Apps Script Setup

1. Create a new Google Apps Script project
2. Set up the following endpoints:
   - Authentication (login, password reset)
   - Jobs (CRUD operations)
   - Equipment (tracking and management)
   - QR Scans (logging and history)
   - Ratings (feedback management)
   - Admin Notes (internal communications)

3. Update the `BASE_URL` in `src/services/api.js` with your Apps Script deployment URL

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_APP_NAME=GoGoBubbles Bubbler Dashboard
```

## 📱 Features in Detail

### Authentication System
- **Multi-factor Authentication**: Email/password + biometric support
- **Password Reset**: 15-minute token-based reset system
- **Password Strength**: Real-time strength validation
- **Remember Me**: Persistent login sessions
- **Auto-fill**: Biometric credential storage

### Job Management
- **Status Tracking**: Pending → Accepted → In Progress → Completed
- **Photo Requirements**: Automatic prompts for jobs requiring documentation
- **Privacy Controls**: Hide customer addresses after job completion
- **Real-time Updates**: Live status updates and notifications

### QR Code System
- **Laundry Tracking**: Scan bags for pickup/delivery
- **Equipment Tracking**: Track equipment assignments
- **History Logging**: Complete scan history and audit trail
- **Offline Support**: Queue scans when offline

### Equipment Management
- **Assignment Tracking**: Who has what equipment
- **Rental Periods**: Due dates and return tracking
- **Condition Monitoring**: Equipment condition tracking
- **Maintenance Alerts**: Automated maintenance reminders

### Admin Features
- **Team Overview**: All bubblers and their status
- **Job Assignment**: Drag-and-drop job assignment
- **Performance Analytics**: Team metrics and KPIs
- **Communication Tools**: Internal notes and messaging

## 🎯 Usage Guide

### For Bubblers

1. **Login**: Use your email and password or biometric authentication
2. **View Daily Jobs**: Check your assigned jobs for the day
3. **Accept/Decline**: Review and accept or decline job assignments
4. **Start Jobs**: Begin work and update job status
5. **Upload Photos**: Take photos for jobs requiring documentation
6. **Scan QR Codes**: Track laundry bags and equipment
7. **Complete Jobs**: Mark jobs as finished and submit completion data
8. **Track Earnings**: View your earnings and performance metrics

### For Administrators

1. **Dashboard Overview**: View team performance and system alerts
2. **Job Management**: Assign, reassign, and monitor all jobs
3. **Equipment Tracking**: Manage equipment assignments and returns
4. **Team Management**: View all bubblers and their status
5. **Analytics**: Review performance metrics and trends
6. **Communication**: Add admin notes and internal communications

## 🔒 Security Features

- **Authentication**: Secure login with session management
- **Authorization**: Role-based access control (Bubbler vs Admin)
- **Data Privacy**: Customer address hiding after job completion
- **API Security**: Secure Google Apps Script endpoints
- **Input Validation**: Client and server-side validation

## 📈 Performance

- **Fast Loading**: Optimized with Vite build system
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Offline Support**: Basic offline functionality for critical features
- **Real-time Updates**: Live data synchronization

## 🐛 Troubleshooting

### Common Issues

1. **Camera Access**: Ensure camera permissions are granted for QR scanning
2. **Biometric Login**: Requires device support and user setup
3. **API Errors**: Check Google Apps Script deployment and permissions
4. **Offline Mode**: Some features require internet connection

### Support

For technical support or feature requests, please contact the development team.

## 📄 License

This project is proprietary software for GoGoBubbles. All rights reserved.

## 🤝 Contributing

This is an internal application for GoGoBubbles. For feature requests or bug reports, please contact the development team.

---

**Built with ❤️ for GoGoBubbles**
