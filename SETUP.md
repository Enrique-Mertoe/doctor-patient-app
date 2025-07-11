# Medical Appointment Booking System Setup

## Prerequisites
- Node.js 18+ installed
- Supabase account

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Supabase Setup
1. Create a new Supabase project at https://supabase.com
2. Go to Settings > API to get your project URL and anon key
3. Go to Settings > API > Service Role to get your service role key
4. Update `.env.local` with your Supabase credentials

### 3. Database Setup
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the SQL to create tables and functions

### 4. Update Doctor ID
1. After running the schema, go to Table Editor > doctors
2. Copy the generated doctor ID
3. Update the `doctorId` variable in `app/dashboard/AppointmentBooking.js`

### 5. Run the Application
```bash
npm run dev
```

## Key Features

### Database Schema
- **doctors**: Stores doctor information (scalable for multiple doctors)
- **time_slots**: Manages appointment time slots with capacity tracking
- **patients**: Stores patient information linked to auth users
- **appointments**: Links patients to time slots with medical conditions

### API Endpoints
- `GET /api/time-slots?date=YYYY-MM-DD&doctorId=UUID` - Get available slots
- `POST /api/time-slots` - Generate slots for a date
- `POST /api/appointments` - Book an appointment
- `GET /api/appointments` - Get user's appointments

### Security Features
- Server-side authentication with Supabase SSR
- Protected dashboard routes
- API-side data validation
- Automatic capacity management with database triggers

### Time Slot Management
- Generates slots from 8:00 AM to 5:00 PM
- 1 hour 30 minute duration per slot
- Maximum 5 patients per slot
- Prevents double booking with real-time capacity tracking

## Architecture Benefits

### Scalability
- Easy to add multiple doctors
- Flexible time slot configuration
- Modular component structure

### Performance
- Server-side rendering for protected pages
- Database indexes for fast queries
- Efficient capacity checking with triggers

### Security
- Supabase Row Level Security ready (currently API-side validation)
- Protected routes with server-side auth checks
- Secure patient data handling