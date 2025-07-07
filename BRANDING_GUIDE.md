# GoGoBubbles Dashboard Branding Guide

This guide documents the consistent branding system used across the GoGoBubbles Bubbler Dashboard, matching the design from our HTML pages (booking.html, index.html, jobs.html).

## 🎨 Color Palette

### Primary Brand Colors
```css
/* Exact matches from HTML pages */
--brand-aqua: #4fd1c5
--brand-aqua-light: #2ed8c3
--brand-aqua-dark: #1fc2a7
--brand-blue: #4299e1
--brand-blue-dark: #3182ce
--brand-yellow: #FFD166
--brand-red: #E63946
```

### Usage in Tailwind
```jsx
// Primary actions, buttons, highlights
className="bg-brand-aqua text-white"

// Secondary actions, accents
className="bg-brand-blue text-white"

// Warnings, alerts
className="bg-brand-red text-white"

// Highlights, promotions
className="bg-brand-yellow text-gray-800"
```

## 🔤 Typography

### Font Families
- **Headings**: `font-poppins` (Poppins, sans-serif)
- **Body Text**: `font-inter` (Inter, sans-serif)
- **Alternative**: `font-open-sans` (Open Sans, sans-serif)

### Font Weights
- **Regular**: `font-normal` (400)
- **Semibold**: `font-semibold` (600)
- **Bold**: `font-bold` (700)

### Usage
```jsx
// Page titles
<h1 className="text-2xl font-bold text-gray-800 font-poppins">

// Section headers
<h2 className="text-xl font-bold text-gray-800 font-poppins">

// Card titles
<h3 className="text-lg font-bold text-gray-800 font-poppins">

// Body text
<p className="text-gray-600 font-inter">
```

## 🎯 Component Styles

### Buttons
```jsx
// Primary button (brand aqua)
<button className="btn-primary">
  Sign in
</button>

// Secondary button (brand blue)
<button className="btn-secondary">
  Cancel
</button>

// Outline button
<button className="btn-outline">
  Learn More
</button>
```

### Cards
```jsx
// Standard card
<div className="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

// Hoverable card
<div className="card-hover">
  <h3>Interactive Card</h3>
  <p>Hover for effect</p>
</div>

// Branded card with icon
<BrandedCard 
  title="Card Title" 
  icon={FiHome} 
  color="brand-aqua"
>
  Card content
</BrandedCard>
```

### Forms
```jsx
// Form inputs
<input className="form-input" placeholder="Enter text" />

// Form labels
<label className="form-label">Field Label</label>
```

### Modals
```jsx
<Modal 
  title="Modal Title" 
  size="md" 
  onClose={handleClose}
>
  Modal content
</Modal>
```

## 🌈 Gradients

### Background Gradients
```jsx
// Primary gradient (aqua to blue)
<div className="bg-gradient-primary">

// Secondary gradient (blue to aqua)
<div className="bg-gradient-secondary">

// Page background
<div className="bg-gradient-to-br from-gray-50 to-blue-50">
```

## 📱 Layout & Spacing

### Container Spacing
```jsx
// Main content area
<main className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 pt-20">

// Card spacing
<div className="space-y-6">

// Grid layouts
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
```

### Border Radius
```jsx
// Small radius
className="rounded-lg"

// Medium radius (cards, buttons)
className="rounded-xl"

// Large radius (main cards)
className="rounded-2xl"

// Extra large radius (modals, login)
className="rounded-3xl"
```

## 🎭 Interactive States

### Hover Effects
```jsx
// Button hover
className="hover:bg-brand-aqua-light hover:shadow-button-hover"

// Card hover
className="hover:shadow-lg hover:-translate-y-1"

// Icon hover
className="hover:text-brand-aqua transition-colors"
```

### Loading States
```jsx
// Loading spinner
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-aqua" />

// Loading button
<button className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
  {loading ? 'Loading...' : 'Submit'}
</button>
```

## 🎨 Status Colors

### Success
```jsx
className="bg-green-50 border-2 border-green-200 text-green-800"
```

### Warning
```jsx
className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800"
```

### Error
```jsx
className="bg-red-50 border-2 border-red-200 text-red-700"
```

### Info
```jsx
className="bg-blue-50 border-2 border-blue-200 text-blue-800"
```

## 📐 Shadows

### Shadow Classes
```jsx
// Card shadow
className="shadow-card"

// Button shadow
className="shadow-button"

// Hover shadow
className="shadow-button-hover"

// Sticky element shadow
className="shadow-sticky"
```

## 🎪 Animations

### Logo Animation
```jsx
// Floating logo
<img className="logo-float" src="/logo.png" alt="Logo" />
```

### Page Transitions
```jsx
// Fade in
className="animate-in fade-in duration-200"

// Slide up
className="animate-in slide-in-from-bottom duration-300"
```

## 📱 Responsive Design

### Mobile-First Approach
```jsx
// Responsive text sizes
className="text-2xl md:text-3xl lg:text-4xl"

// Responsive padding
className="p-4 sm:p-6 lg:p-8"

// Responsive grid
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
```

## 🎯 Best Practices

### 1. Consistent Color Usage
- Use `brand-aqua` for primary actions and highlights
- Use `brand-blue` for secondary actions and navigation
- Use semantic colors (green, red, yellow) for status indicators

### 2. Typography Hierarchy
- Use `font-poppins` for all headings
- Use `font-inter` for body text
- Maintain consistent font weights (400, 600, 700)

### 3. Spacing Consistency
- Use the spacing scale: 4, 6, 8, 12, 16, 20, 24, 32, 48, 64
- Maintain consistent padding and margins across components

### 4. Interactive Feedback
- Always provide hover states for interactive elements
- Use transitions for smooth interactions
- Include loading states for async operations

### 5. Accessibility
- Maintain sufficient color contrast
- Use semantic HTML elements
- Include proper ARIA labels and roles

## 🔧 Custom CSS Classes

The following custom classes are available in `src/index.css`:

```css
/* Button styles */
.btn-primary
.btn-secondary
.btn-outline

/* Card styles */
.card
.card-hover

/* Form styles */
.form-input
.form-label

/* Gradient backgrounds */
.bg-gradient-primary
.bg-gradient-secondary

/* Logo animation */
.logo-float

/* Highlight styles */
.highlight-yellow
.highlight-red
```

## 📝 Example Usage

```jsx
import React from 'react';
import { FiHome, FiUser, FiSettings } from 'react-icons/fi';
import BrandedCard from '../shared/BrandedCard';

const ExampleComponent = () => {
  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-primary rounded-2xl p-6 text-white shadow-card">
        <h1 className="text-2xl font-bold mb-2 font-poppins">
          Welcome back, User!
        </h1>
        <p className="text-blue-100 font-medium">
          Here's what's happening today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BrandedCard 
          title="Total Jobs" 
          icon={FiHome} 
          color="brand-aqua"
        >
          <p className="text-2xl font-bold text-gray-800">24</p>
        </BrandedCard>
        
        <BrandedCard 
          title="Completed" 
          icon={FiUser} 
          color="green"
        >
          <p className="text-2xl font-bold text-gray-800">18</p>
        </BrandedCard>
        
        <BrandedCard 
          title="Pending" 
          icon={FiSettings} 
          color="brand-blue"
        >
          <p className="text-2xl font-bold text-gray-800">6</p>
        </BrandedCard>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <button className="btn-primary">
          Create New Job
        </button>
        <button className="btn-outline">
          View All Jobs
        </button>
      </div>
    </div>
  );
};

export default ExampleComponent;
```

This branding system ensures consistency across all dashboard components while maintaining the professional, modern look of the GoGoBubbles brand. 