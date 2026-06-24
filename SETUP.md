# Doorden — Setup Guide

## Quick Start

```bash
cd C:\Users\abomb\doorden
npm install
npx prisma migrate dev
npx tsx prisma/seed.ts
npm run dev
```

Open http://localhost:3000

## Default Admin Login
- Email: `admin@doorden.com`
- Password: `admin123`

## Environment Variables (.env)

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (required for real payments — get from https://dashboard.stripe.com)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Stripe Setup (Production)
1. Create account at stripe.com
2. Add STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY from your Stripe Dashboard
3. For webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Add STRIPE_WEBHOOK_SECRET from the CLI output

## Without Stripe (Demo Mode)
The app works without Stripe keys — payments fall back to demo mode that directly
marks jobs as confirmed. Perfect for testing the full workflow.

## User Roles
- **Admin**: admin@doorden.com / admin123
- **Rep**: Sign up at /signup/rep
- **Business**: Sign up at /signup/business

## Key Workflows

### Rep Workflow
1. Sign up as rep → get Level 1 training
2. View training content at /rep/training
3. Upgrade training (Levels 2-4 require payment + admin confirmation)
4. Submit jobs at /rep/jobs/new (minimum 3 photos required)
5. Track job status and commissions on dashboard

### Business Workflow
1. Sign up at /signup/business (set min rep level + pricing description)
2. Review incoming jobs in dashboard
3. Accept or decline with optional reason
4. Copy deposit payment link to share with homeowner
5. Mark jobs completed once done

### Admin Workflow
1. Login at /login
2. /admin — overview dashboard
3. /admin/users — activate/deactivate users, adjust training levels
4. /admin/training — confirm training purchases, add training content
5. /admin/payouts — mark rep commissions as paid
6. Export CSVs for jobs and reps

## File Uploads
Uploaded job photos are stored in `public/uploads/`. For production, 
replace with cloud storage (S3, Cloudinary, etc.)
