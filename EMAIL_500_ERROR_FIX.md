# ❌ 500 Error - Fix Guide: Gmail Authentication Issue

## Problem
When clicking "Send Reset Code", you get:
```
POST http://localhost:3000/api/v1/user/forgot-password 500 (Internal Server Error)
```

## Root Cause
Gmail is rejecting the login because:
- The password in `.env` is a regular Google account password
- Gmail requires an **"App Password"** when 2-Factor Authentication (2FA) is enabled
- Or Gmail blocks "Less secure apps" by default

## ✅ Solution

### Option 1: Use Gmail App Password (Recommended)

#### Step 1: Enable 2-Factor Authentication on Gmail
1. Go to https://myaccount.google.com/security
2. Scroll to "How you sign in to Google"
3. Click "2-Step Verification"
4. Follow the prompts to enable it

#### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Windows" (or your device)
3. Click "Generate"
4. Google will show a 16-character password
5. Copy this password

#### Step 3: Update .env File
In `Backend/.env`, replace the EMAIL_PASSWORD with the 16-character password:

**BEFORE:**
```env
EMAIL_USER=djjivanidjpatel@gmail.com
EMAIL_PASSWORD=Djpatel@109
```

**AFTER:**
```env
EMAIL_USER=djjivanidjpatel@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
```
(Replace with your actual 16-character App Password - without spaces)

#### Step 4: Restart Backend
```bash
npm start
```

---

### Option 2: Testing in Development Mode (Without Email Setup)

If you don't want to set up Gmail, use development mode:

1. **Backend will auto-detect missing credentials** and show OTP in console
2. **Frontend will show the OTP in browser console** when you click "Send Reset Code"
3. **Copy the OTP** from console and paste it in the form

**How it works:**
- No email service needed for testing
- OTP appears in both server and browser console
- Useful for development and testing

To test in console:
1. Open Browser DevTools (F12)
2. Go to Console tab
3. Click "Send Reset Code"
4. Look for the OTP in red text in console
5. Use that OTP in the form

---

## 🔧 Email Setup Instructions (Gmail)

### For Gmail Users (Most Common)

**Step-by-Step:**
1. **Enable 2FA on your Google account**
   - Go: https://myaccount.google.com/security
   - Find: "2-Step Verification"
   - Enable it

2. **Generate App Password**
   - Go: https://myaccount.google.com/apppasswords
   - Select: Mail → Windows
   - Copy: 16-character password (remove spaces)

3. **Update Backend/.env**
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxxxxxxxxxxxxxx
   ```

4. **Restart Backend**
   ```bash
   cd Backend
   npm start
   ```

5. **Test Forgot Password**
   - Navigate to login page
   - Click "Forgot password?"
   - Enter your registered email
   - Click "Send Reset Code"
   - Check your email inbox for OTP

---

## 🧪 Testing Without Real Email

If you want to test without setting up Gmail:

1. **Backend automatically detects missing credentials**
2. **Shows OTP in server console instead**
3. **Frontend shows OTP in browser console**

### Console Output Examples:

**Server Console (Terminal):**
```
========== PASSWORD RESET OTP ==========
Email: user@example.com
OTP: 123456
Valid for: 10 minutes
==========================================
```

**Browser Console (DevTools):**
```
⚠️ DEVELOPMENT MODE: Your OTP is: 123456
```

---

## 🚨 Common Gmail Issues

### Issue 1: "Less secure app access"
**Error:** `Authentication failed`

**Solution:** 
- Enable 2FA and use App Password (see above)
- OR disable "Less secure app access" (not recommended)

### Issue 2: Wrong password format
**Error:** `Invalid credentials`

**Solution:**
- Make sure you copied the 16-character App Password correctly
- Don't include spaces in the password
- Check for typos

### Issue 3: Still getting 500 error
**Solution:**
1. Restart your backend server
2. Check server console for error message
3. Use development mode (OTP in console)

---

## 📋 Checklist

- [ ] 2FA enabled on Google Account
- [ ] App Password generated from Google
- [ ] App Password copied to EMAIL_PASSWORD in .env
- [ ] No spaces in the password
- [ ] Backend restarted after .env change
- [ ] Browser cache cleared
- [ ] Try the forgot password flow again

---

## 🎯 If You're Still Getting 500 Error

1. **Check Backend Console**
   - Look for "Email sending error" message
   - Check the actual error being thrown

2. **Verify .env File**
   ```bash
   # Check if .env exists and has correct values
   cat Backend/.env | grep EMAIL
   ```

3. **Use Development Mode**
   - Email credentials not required
   - OTP shown in console for testing

4. **Restart Everything**
   ```bash
   # Kill backend and frontend processes
   # Clear node_modules cache if needed
   npm start
   ```

---

## 📊 Email Service Alternatives

If Gmail doesn't work, try:

### SendGrid
```env
SENDGRID_API_KEY=your-key
SENDGRID_EMAIL=noreply@example.com
```

### Mailgun
```env
MAILGUN_DOMAIN=your-domain
MAILGUN_API_KEY=your-key
```

### AWS SES
```env
AWS_ACCESS_KEY=your-key
AWS_SECRET_KEY=your-secret
AWS_REGION=us-east-1
```

---

## ✅ Verification Steps

After setting up Gmail App Password:

1. **Server should show:**
   ```
   Email credentials configured ✓
   ```

2. **No error in console when clicking "Send Reset Code"**

3. **Frontend shows success toast:**
   ```
   "Reset link sent to your email"
   ```

4. **Check your email inbox for OTP**

5. **Use OTP in the form to proceed**

---

## 💡 Development vs Production

### Development (No Email Setup)
- OTP shown in server console
- OTP shown in browser console
- No actual email sent
- Perfect for testing

### Production (Real Email)
- Gmail App Password required
- Emails actually sent
- OTP only visible to user in email
- Secure password reset flow

---

## Need More Help?

**Error Message in Server Console:**
- Shows exact email service error
- Check for "Authentication failed" - credentials issue
- Check for "Invalid email" - email format issue

**Check logs:**
```bash
# Look at server console output
# It will show the actual error from nodemailer/Gmail
```

---

**Status:** Follow the steps above and the error should be resolved!

Most common solution: **Use Gmail App Password instead of regular password**
