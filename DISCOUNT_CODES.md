# Discount Codes Implementation

## Overview
The maintenance tracker now supports Stripe discount codes (coupons) that can be applied during onboarding to reduce subscription costs.

## Features Implemented ✅

### **Onboarding Integration**
- ✅ Discount code input field with real-time validation
- ✅ Live pricing calculation showing discount applied
- ✅ Visual feedback for valid/invalid codes
- ✅ Automatic application to subscription during signup

### **Discount Code Validation**
- ✅ Real-time validation via `/api/billing/validate-discount`
- ✅ Checks for code validity, expiration, and usage limits
- ✅ Debounced input to prevent excessive API calls
- ✅ Clear error messages for invalid codes

### **Subscription Creation**
- ✅ Automatic application of valid discount codes
- ✅ Supports both percentage and fixed amount discounts
- ✅ Database tracking of applied discounts
- ✅ Graceful handling of invalid codes (continues without discount)

### **Billing Dashboard**
- ✅ Display of active discounts in admin billing tab
- ✅ Shows discount type, amount, and expiration date
- ✅ Clear visual indicators for discounted pricing

## How to Create Discount Codes in Stripe

### **Via Stripe Dashboard:**
1. Go to **Products** → **Coupons** → **Create coupon**
2. Set **Coupon ID** (this is what users will enter)
3. Choose **Discount Type**:
   - **Percentage**: e.g., 20% off
   - **Fixed Amount**: e.g., $10.00 off
4. Set **Duration**:
   - **Once**: Applied to first invoice only
   - **Forever**: Applied to all invoices
   - **Repeating**: Applied for X months
5. Optional settings:
   - **Expiration date**
   - **Maximum redemptions**
   - **Minimum order amount**

### **Example Discount Codes:**
- `WELCOME20` - 20% off first month
- `SAVE10` - $10 off monthly subscription
- `NEWCUSTOMER` - 50% off first 3 months

### **Via Stripe API:**
```javascript
const coupon = await stripe.coupons.create({
  id: 'WELCOME20',
  percent_off: 20,
  duration: 'once',
  name: 'Welcome Discount - 20% Off',
  redeem_by: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days from now
});
```

## Database Schema

### **Added to `mt_companies`:**
- `discount_code` (text) - The applied coupon code
- `discount_amount_off` (integer) - Fixed discount amount in cents
- `discount_percent_off` (decimal) - Percentage discount (0.00-100.00)
- `discount_expires_at` (timestamp) - When the discount expires

## API Endpoints

### **POST /api/billing/validate-discount**
Validates a discount code and returns coupon details.

**Request:**
```json
{
  "discountCode": "WELCOME20"
}
```

**Response (Valid):**
```json
{
  "valid": true,
  "coupon": {
    "id": "WELCOME20",
    "name": "Welcome Discount",
    "percent_off": 20,
    "duration": "once",
    "redeem_by": 1640995200
  }
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "error": "This discount code has expired"
}
```

## User Experience

### **During Onboarding:**
1. User enters discount code in optional field
2. Code is validated in real-time (500ms debounce)
3. Valid codes show green success message and updated pricing
4. Invalid codes show red error message
5. Subscription is created with discount applied

### **In Billing Dashboard:**
1. Active discounts are displayed prominently
2. Shows discount type, amount, and expiration
3. Clear visual distinction from regular pricing

## Testing

### **Test with Stripe Test Codes:**
- Create test coupons in Stripe Dashboard (Test mode)
- Test various scenarios:
  - Valid percentage discount
  - Valid fixed amount discount
  - Expired coupon
  - Coupon at redemption limit
  - Invalid coupon code

### **Test Flow:**
1. Go to `/onboarding`
2. Complete steps 1 & 2
3. On Step 3 (Billing), enter test discount code
4. Verify pricing updates and success message
5. Complete onboarding
6. Check Profile → Billing tab for discount info

## Error Handling
- Invalid codes fail gracefully without breaking onboarding
- Network errors show user-friendly messages
- Server-side validation prevents invalid discount application
- Webhook events can handle discount expiration (future enhancement)

## Future Enhancements
- Email notifications when discounts expire
- Admin interface to create/manage discount codes
- Usage analytics for discount code effectiveness
- Automatic discount application based on customer segments