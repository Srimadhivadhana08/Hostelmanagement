# 🚀 How to Deploy Hostel Hub on Railway
> Complete step-by-step deployment guide. See `DEPLOY_TO_RAILWAY.md` for full details.

## Quick Reference

### Required Environment Variables for Railway:
```
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/hostel-management?retryWrites=true&w=majority
NEXTAUTH_URL=https://YOUR-APP.up.railway.app
NEXTAUTH_SECRET=v0+owe8QFLNLkQmF75u3OrkZSLCwuIq138RLrVvqwao=
NODE_ENV=production
```

### After Deployment — Seed the Database:
Visit: `https://YOUR-APP.up.railway.app/api/seed?secret=hostel-seed-2026`

### Default Login Credentials (change after first login!):
```
Admin:   admin@hostel.com    / Admin@123
Warden:  warden1@hostel.com  / Warden@123
Student: student1@hostel.com / Student@123
```

### Update Your App Later:
```bash
git add .
git commit -m "your changes"
git push
```
Railway auto-deploys on every push! 🎉
