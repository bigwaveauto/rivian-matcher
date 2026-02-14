# Big Wave Auto — Rivian Inventory Tool Setup Guide

## Overview

Your app has two sides:
- **Customer view** — browse available Rivians, filter by specs, see pricing, inquire on vehicles, or request notifications for future inventory
- **Admin dashboard** — view all inquiries and notification requests at `yoursite.com/#admin`

---

## PART 1: Set Up Supabase (Free Database)

### Step 1: Create a Supabase account
1. Go to **https://supabase.com** → click **Start your project**
2. Sign up with GitHub or email
3. Click **New Project**, name it `rivian-matcher`
4. Set a database password, choose a region close to you
5. Click **Create new project** — wait ~2 minutes

### Step 2: Create the database tables
1. In Supabase dashboard → click **SQL Editor** in the left sidebar
2. Click **New query**
3. Paste this ENTIRE block and click **Run**:

```sql
-- Customer inquiries on specific vehicles
create table inquiries (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  name text not null,
  phone text not null,
  email text,
  vin text,
  vehicle_desc text,
  retail_price integer,
  wholesale_cost integer
);

-- "Notify me" requests for future inventory
create table requests (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  name text not null,
  email text,
  phone text not null,
  notes text,
  years jsonb default '[]',
  models jsonb default '[]',
  motors jsonb default '[]',
  batteries jsonb default '[]',
  wheels jsonb default '[]',
  colors jsonb default '[]',
  interiors jsonb default '[]',
  upgrades jsonb default '[]',
  features jsonb default '[]',
  max_budget integer default 120000,
  max_mileage integer default 100000
);

-- Security policies (allow public access)
alter table inquiries enable row level security;
create policy "Anyone can insert inquiries" on inquiries for insert to anon with check (true);
create policy "Anyone can read inquiries" on inquiries for select to anon using (true);
create policy "Anyone can delete inquiries" on inquiries for delete to anon using (true);

alter table requests enable row level security;
create policy "Anyone can insert requests" on requests for insert to anon with check (true);
create policy "Anyone can read requests" on requests for select to anon using (true);
create policy "Anyone can delete requests" on requests for delete to anon using (true);
```

4. You should see "Success"

### Step 3: Get your Supabase keys
1. In Supabase → **Settings** (gear icon) → **API**
2. Copy your **Project URL** (looks like `https://abcdefgh.supabase.co`)
3. Copy your **anon/public key** (long string starting with `eyJ...`)

### Step 4: Add keys to the code
1. Open `src/App.jsx` in a text editor
2. Find these lines near the top (~line 9-10):
```javascript
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY_HERE";
```
3. Replace with your actual values and save

### Step 5: Change your admin password
Find this line (~line 42):
```javascript
const ADMIN_PASSWORD = "bigwave2025";
```
Change it to your desired password.

---

## PART 2: Install & Test Locally

### Step 6: Open Terminal, navigate to project
```
cd ~/Desktop/rivian-matcher
```

### Step 7: Install dependencies
```
npm install
```

### Step 8: Test locally
```
npm run dev
```
- Visit the URL shown (usually `http://localhost:5173`)
- Upload your CSV export to see vehicles
- Try filtering, clicking vehicles, and submitting an inquiry
- Visit `http://localhost:5173/#admin` to check admin dashboard

---

## PART 3: Deploy to Digital Ocean

### Step 9: Push to GitHub
If first time:
```
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/rivian-matcher.git
git push -u origin main
```

If updating:
```
git add .
git commit -m "update"
git push
```

### Step 10: Deploy on Digital Ocean
1. Go to https://cloud.digitalocean.com/apps → **Create App**
2. Connect GitHub → select `rivian-matcher`
3. Settings: Static Site, build: `npm run build`, output: `dist`
4. Choose **Starter** plan (free)
5. Deploy — takes 2-5 minutes

---

## PART 4: Embed in Webflow

### Step 11: Add the embed
On your Webflow page, add an HTML Embed element:
```html
<div style="width:100%; max-width:1200px; margin:0 auto;">
  <iframe
    src="https://your-digital-ocean-url.ondigitalocean.app"
    width="100%"
    height="1200"
    style="border:none; border-radius:12px;"
    loading="lazy">
  </iframe>
</div>
```

### Step 12: Access admin
Bookmark this URL — no need to embed it:
```
https://your-digital-ocean-url.ondigitalocean.app/#admin
```

---

## Weekly Workflow

1. Export your latest auction/inventory CSV
2. Upload it to your site (the CSV upload is built into the customer page)
   - For production, you may want to pre-upload via admin — ask me to add this
3. Go to `#admin` to check new inquiries and notify-me requests
4. Reach out to customers within 48 hours

---

## How It Works for Customers

1. They see all available vehicles with filters on the left
2. As they select Year, Model, Trim, Color — the list narrows instantly
3. They can adjust Max Price to fit their budget
4. Click any vehicle to see full cost breakdown
5. Click "I'm Interested" to send you an inquiry on that specific vehicle
6. If nothing matches, they click "Notify Me When My Spec Comes In"
7. They fill out their dream spec and get the confirmation: "Big Wave Auto will reach out within 48 hours"

---

## Troubleshooting

**Inquiries/requests not showing in admin**
→ Check your Supabase URL and key in App.jsx. Verify in Supabase → Table Editor.

**CSV upload not working**
→ Make sure the file is a .csv with headers matching the Manheim export format.

**Prices showing $0**
→ The MMR or Buy Now Price column might be empty for some vehicles. Toggle between MMR/Buy Now in the pricing panel.

**Admin page blank after login**
→ Check browser console (Right-click → Inspect → Console) for errors.
