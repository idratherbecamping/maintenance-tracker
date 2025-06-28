# Demo Setup Instructions

Follow these steps to set up the demo environment with sample data.

## 1. Set Up Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to finish provisioning

## 2. Create Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Copy and paste the entire contents of `supabase/schema.sql`
3. Run the query to create all tables, policies, and default data

## 3. Create Demo User Account

1. In Supabase dashboard, go to **Authentication** → **Users**
2. Click **Add user** → **Create a new user**
3. Enter:
   - **Email**: `demo@example.com`
   - **Password**: `demo123`
   - **Auto Confirm User**: ✅ (checked)
4. Click **Create user**

## 4. Add Demo Data

**Option A - Clean Install (Recommended):**
1. Go back to **SQL Editor**
2. Copy and paste the entire contents of `supabase/demo-data-clean.sql`
3. Run the query to create all demo data

**Option B - If you need to start over:**
1. First run `supabase/cleanup-demo-data.sql` to remove existing demo data
2. Then run `supabase/demo-data-clean.sql` to create fresh demo data

The clean version safely handles existing data and won't cause duplicate key errors.

## 5. Set Up Storage for Images

1. Go to **Storage** in Supabase dashboard
2. Click **New bucket**
3. Enter name: `maintenance-images`
4. Make it **Public** bucket
5. Click **Create bucket**

## 6. Configure Environment Variables

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Create `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Demo Mode (enable auto-login)
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_DEMO_EMAIL=demo@example.com
NEXT_PUBLIC_DEMO_PASSWORD=demo123
```

## 7. Start the Application

```bash
npm run dev
```

Visit `http://localhost:3000` - the app should automatically log you in with the demo account!

## Demo Data Included

The demo environment includes:

### 🏢 Company
- **Demo Fleet Management** (sample company)

### 👥 Users
- **Demo Owner** (demo@example.com) - Owner role
- UUID: `a696b48c-f756-41f0-b10f-fb7428328b51`

### 🚗 Vehicles (5 total)
- **2022 Ford F-150** (FLEET-001) - 45,000 miles, $35,000 value
- **2021 Toyota Camry** (FLEET-002) - 32,000 miles, $22,000 value
- **2023 Chevrolet Silverado** (FLEET-003) - 15,000 miles, $38,000 value
- **2020 Honda Civic** (FLEET-004) - 52,000 miles, $18,000 value
- **2022 Ram 1500** (FLEET-005) - 28,000 miles, $33,000 value

### 🔧 Maintenance Records (10 total)
- **Oil changes** ($75.50, $68.25, $82.00)
- **Brake service** ($320.75)
- **Tire rotation** ($45.00)
- **Transmission service** ($185.00)
- **Air filter replacement** ($35.99)
- **Coolant flush** ($125.50)
- **Inspection** ($25.00)
- **Custom: Windshield service** ($28.99)

**Total maintenance costs**: $1,091.98

### 📅 Recommendations
- Oil change reminders
- Brake inspections
- Transmission services
- Tire rotations

## Demo Features to Test

1. **Dashboard** - View fleet overview and costs
2. **Vehicle Management** - Add, edit, view vehicle details
3. **Maintenance Logging** - TypeForm-style multi-step form
4. **History** - View all maintenance records
5. **Mobile Responsive** - Test on different screen sizes

## Disable Demo Mode

To disable auto-login and demo banner:

```bash
NEXT_PUBLIC_DEMO_MODE=false
```

## Troubleshooting

### Auto-login not working?
- Check that the demo user exists in Supabase Auth
- Verify email/password in environment variables
- Check browser console for authentication errors

### No data showing?
- Verify demo-data.sql was run successfully
- Check that user IDs in demo data match the actual Supabase Auth user ID
- Confirm RLS policies are working

### Images not uploading?
- Make sure `maintenance-images` bucket exists
- Verify bucket is set to public
- Check storage policies allow uploads

Enjoy exploring the demo! 🚀