# Project Plan: Add Day-of-Week Selector for Time-Based Reminders

## Analysis Summary

I found the exact location where the day-of-week selector needs to be added:

### Key Files Identified:
1. **Main Form Component**: `/home/ggesirie/Documents/maintenance_tracker/maintenance-tracker/src/app/reminders/rules/new/page.tsx`
   - This is the reminder rule creation form where users create new reminder rules
   - Contains all the form fields for trigger_type, time_interval_days, etc.
   - Uses React Hook Form with Zod validation

2. **Database Schema**: 
   - The `day_of_week` column already exists in the `mt_reminder_rules` table
   - It's defined as `INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6)`
   - 0 = Sunday, 1 = Monday, ..., 6 = Saturday, NULL = no preference

3. **TypeScript Types**: 
   - The database types already include `day_of_week: number | null` in the Row, Insert, and Update types

### Current Form Structure:
- The form has conditional rendering based on `triggerType` 
- When `triggerType === 'time_interval'`, it shows the time interval input field
- This is exactly where the day-of-week selector should be added

## Implementation Plan

### Todo Items:
- [ ] Add day_of_week field to the Zod schema validation
- [ ] Add day_of_week field to the form state management
- [ ] Add the day-of-week selector UI component in the time_interval conditional block
- [ ] Include day_of_week in the form submission data
- [ ] Test the implementation

### Implementation Details:

1. **Schema Update**: Add `day_of_week: z.number().min(0).max(6).optional()` to the `reminderRuleSchema`

2. **UI Component**: Add a select dropdown with days of the week options in the `triggerType === 'time_interval'` conditional block

3. **Form Submission**: Include `day_of_week` in the reminder rule data sent to the database

4. **User Experience**: 
   - Show the day-of-week selector only for time-based reminders
   - Make it optional (allow NULL for "no preference")
   - Use clear labels like "Monday", "Tuesday", etc.

The implementation will be straightforward since:
- The database schema is already set up
- The TypeScript types are already defined
- The form infrastructure is already in place
- We just need to add the UI component and form logic