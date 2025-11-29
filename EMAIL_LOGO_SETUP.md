# Email Logo Setup

Your logo needs to be hosted publicly for it to show in emails.

## Option 1: Use GitHub (Recommended - Free & Permanent)

1. Create a new folder in your repo:
   ```
   Expense-Tracker/public/email/
   ```

2. Save your logo there as `logo.png`

3. After deploying to GitHub Pages, the logo URL will be:
   ```
   https://abhi0626-kr.github.io/Expense-Tracker/email/logo.png
   ```

4. Use this in your EmailJS template:
   ```html
   <img src="https://abhi0626-kr.github.io/Expense-Tracker/email/logo.png" alt="Expense Tracker" style="width: 120px; height: 120px; margin-bottom: 10px;">
   ```

## Option 2: Use Imgur (Quick & Easy)

1. Go to https://imgur.com/upload
2. Upload your logo image
3. Right-click the uploaded image → Copy image address
4. Use that URL in your EmailJS template

## Option 3: Use ImgBB (No Account Needed)

1. Go to https://imgbb.com/
2. Click "Start uploading"
3. Upload your logo
4. Copy the "Direct Link"
5. Use in EmailJS template

## Steps to Update EmailJS Template:

1. Upload logo using one of the options above
2. Copy the public URL
3. Go to your EmailJS template editor
4. Replace `<img>` tag with:
   ```html
   <img src="YOUR_LOGO_URL_HERE" alt="Expense Tracker" style="width: 120px; height: 120px; margin-bottom: 10px;">
   ```
5. Click Save
6. Test by sending another signup email

## Temporary Solution (While Setting Up):

Replace the broken `<img>` with this emoji until you get the hosted URL:

```html
<div style="text-align: center; font-size: 64px; margin-bottom: 10px;">
  🛡️💰
</div>
```

The GitHub Pages option is best for production since it's permanent and you control it.
