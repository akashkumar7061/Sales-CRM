# 🚀 Deployment Guide: Vercel (Frontend) & Render (Backend)

Follow these step-by-step instructions to deploy your Sales CRM application live on **Render** (Backend API & Database) and **Vercel** (Frontend UI).

---

## 📌 Step 1: Set Up Free Cloud MongoDB (MongoDB Atlas)

1. Go to [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas) and sign up for a free account.
2. Create a free **M0 Shared Cluster**.
3. Under **Database Access**, create a database user (e.g. `crm_admin` / password).
4. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** $\rightarrow$ **Drivers (Node.js)** and copy your connection string:
   ```env
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/sales_crm?retryWrites=true&w=majority
   ```

---

## 📌 Step 2: Push Your Code to GitHub

1. In VS Code terminal:
   ```bash
   git init
   git add .
   git commit -m "feat: complete sales crm app with 15 advanced features"
   ```
2. Create a new repository on [GitHub](https://github.com) (e.g. `sales-crm-app`).
3. Push your code:
   ```bash
   git remote add origin https://github.com/<your-username>/sales-crm-app.git
   git branch -M main
   git push -u origin main
   ```

---

## 📌 Step 3: Deploy Backend on Render (Node.js API)

1. Go to [https://render.com](https://render.com) and log in with your GitHub account.
2. Click **New +** $\rightarrow$ **Web Service**.
3. Select your GitHub repository (`sales-crm-app`).
4. Fill in the following settings:
   - **Name**: `sales-crm-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: `Free`
5. Scroll down to **Environment Variables** and add:
   - `NODE_ENV` = `production`
   - `MONGO_URI` = *(Your MongoDB Atlas connection string from Step 1)*
   - `JWT_SECRET` = `super_secret_sales_crm_production_key_2026`
6. Click **Create Web Service**.
7. Once deployed, Render will give you a live URL, for example:
   ```
   https://sales-crm-backend.onrender.com
   ```
   *(Copy this Render backend URL).*

---

## 📌 Step 4: Seed Database on Render (Optional Initial Data)

In your Render Dashboard, click your service $\rightarrow$ **Shell** and run:
```bash
node src/utils/seedData.js
```
*(This will populate all demo accounts, test leads, call logs, and targets).*

---

## 📌 Step 5: Deploy Frontend on Vercel (React Vite)

1. Go to [https://vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Select your GitHub repository (`sales-crm-app`).
4. Configure the project:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://sales-crm-backend.onrender.com` *(Your live Render backend URL from Step 3)*
6. Click **Deploy**.
7. Within 30 seconds, Vercel will give you your live production URL (e.g. `https://sales-crm-app.vercel.app`).

---

## 🔑 Default Login Credentials:

| Role | Email | Password | Access |
|---|---|---|---|
| **Admin** | `admin@crm.com` | `Admin@123` | Full Admin Console, Targets, Exports, All Customers |
| **Sales Rep (Priya)** | `priya@crm.com` | `Sales@123` | Employee Dashboard, Personal Leads, Daily Reports |
| **Sales Rep (Rahul)** | `rahul@crm.com` | `Sales@123` | Employee Dashboard, Personal Leads, Daily Reports |
