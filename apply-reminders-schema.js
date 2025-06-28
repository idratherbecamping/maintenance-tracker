const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://gszyhxvmddsutmooospg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzenloeHZtZGRzdXRtb29vc3BnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzY3NDM0MiwiZXhwIjoyMDYzMjUwMzQyfQ.ImFlSiSPS8DLElXqiw7EcNPVGPjS83rER9mOynfn8yM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchema() {
  try {
    // Read the automated reminders schema
    const schemaPath = path.join(__dirname, 'supabase', 'automated-reminders-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Applying automated reminders schema...');
    
    // Split the schema into individual statements and execute them
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim() + ';';
      if (statement.length > 1) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('query', { query: statement });
        
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
          console.error('Statement:', statement.substring(0, 100) + '...');
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    // Check if tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'mt_%');
      
    if (tablesError) {
      console.error('Error checking tables:', tablesError);
    } else {
      console.log('Current tables:', tables.map(t => t.table_name));
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

applySchema();