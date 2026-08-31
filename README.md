# 🚀 Sales Customer Management Web Application (CRM)

A full-stack, enterprise-grade Sales Customer Management Portal built with **React 18**, **Node.js/Express**, and **MongoDB**.

---

## ✨ Key Features

### 1. 🔐 Role-Based Access Control (RBAC) & Security
- **Admin**: Complete master access to all company customer data, analytics dashboard, employee management, signup approvals, and customer reassignments.
- **Sales Employee**: Dedicated workspace. Sees and manages **only** their own customer records.
- **Strict Security Rules**:
  - Customer records automatically bind the logged-in employee's name and ID.
  - Sales employee name is **immutable** for employees and cannot be tampered with or edited.
  - Only administrators can reassign or change the sales employee on any customer record.
  - Mobile number duplicate detection prevents duplicate leads.
  - Bcrypt password hashing & secure JWT authentication.
  - Employee signup approval workflow (pending review until admin approves).

### 2. 📊 Admin Dashboard & Executive Analytics
- Real-time KPI metric cards (Total Customers, Today's Entries, Total Employees, Active Reps, Pending Follow-ups, Won Deals, Conversion Rate).
- Interactive **Recharts** visualizations:
  - 🏙️ **Top Customer Locations (Cities)**
  - 📈 **Leads by Acquisition Source**
  - 👥 **Customer Records by Sales Employee (Total vs Won Deals)**
  - 🎯 **Pipeline Follow-up Status Distribution**
- Recent customer entries feed with 1-click preview modal.

### 3. 👥 Employee Management (Admin Panel)
- Approve or reject employee signup requests with 1 click.
- Activate or deactivate employee accounts.
- Edit employee details (name, email, phone, designation, role, status, password).
- Real-time stats per employee (Total Assigned Leads, Pending Follow-ups, Won Deals).
- Add new employees directly from the admin panel.

### 4. 📋 Excel-Like Customer Data Table
- Multi-field sorting by Date, Customer Name, Follow-up Date, and Status.
- Real-time search across Customer Name, Mobile Number, Location, City, Product, and Sales Rep.
- Multi-filters by Follow-up Status, Lead Source, Date range, and Assigned Employee (for Admin).
- Configurable pagination (10, 20, 50, 100 rows per page).
- Inline Action buttons: **View Details Modal**, **Edit Record Modal**, **Delete Confirmation Modal**.

### 5. 📑 Customer Form
- Clean 4-section responsive layout:
  1. *Customer & Contact Details* (Entry Date, Name, Mobile, Alternate Mobile, Email)
  2. *Location & Address Details* (Area, City, State, Full Postal Address)
  3. *Product & Requirement Details* (Product/Service interested in, Lead Source, Scope/Requirements)
  4. *Follow-up & Management* (Follow-up Date, Follow-up Status, Sales Rep Assignment, Remarks/History)
- Real-time mobile number duplicate validation on input blur.

### 6. 📁 Excel / CSV Import & Export
- **Export**: One-click download of all customer data (Admin) or personal data (Employee) in `.xlsx` or `.csv`.
- **Import (Admin)**:
  - Drag-and-drop file upload for Excel (`.xlsx`) or CSV (`.csv`).
  - Pre-built Excel template download with formatted headers.
  - Automatic duplicate phone number detection & reporting.
  - Automatic employee name/email matching and assignment.

### 7. 🕒 Audit Activity Trail
- Chronological event logs tracking customer creations, updates, deletions, employee approvals, status changes, and data imports.

---

## 🔑 Default Test Accounts (Pre-Seeded)

| Role | Name | Email | Password | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | System Administrator | `admin@crm.com` | `Admin@123` | Approved |
| **Sales Rep** | Priya Sharma (Lead) | `priya@crm.com` | `Sales@123` | Approved |
| **Sales Rep** | Rahul Verma | `rahul@crm.com` | `Sales@123` | Approved |
| **Sales Rep** | John Doe | `john@crm.com` | `Sales@123` | Approved |
| **Sales Rep** | Sarah Jenkins | `sarah@crm.com` | `Sales@123` | Approved |
| **Pending Signup** | Amit Patel | `amit@crm.com` | `Sales@123` | Pending Approval |

*(The login screen also features 1-click Quick Fill demo buttons for instant testing).*

---

## 🚀 How to Run the Application

### 1. Start Both Frontend & Backend (One Command)
In the project root folder:
```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)

### 2. (Optional) Re-seed Database with Sample Data
```bash
npm run seed
```
