# Scripts Directory

## apply-reminders-schema.js

This script safely applies the automated reminders schema to your Supabase database.

### Setup

1. **Add your service role key to .env.local:**
   ```bash
   # Add this line to your .env.local file (get the key from Supabase Dashboard → Settings → API)
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Usage

```bash
# Run the schema application script
node scripts/apply-reminders-schema.js
```

### What it does

- Reads the `supabase/automated-reminders-schema.sql` file
- Executes each SQL statement safely
- Creates the reminder tables and functions
- Verifies the tables were created successfully

### Security

✅ **SAFE**: Uses environment variables (no hardcoded secrets)
✅ **Gitignore**: .env.local is already ignored by git
✅ **Error handling**: Continues execution even if some statements fail

### Troubleshooting

If you get permission errors, make sure you're using the **service_role** key, not the anon key. The service_role key has admin privileges needed to create tables and functions.