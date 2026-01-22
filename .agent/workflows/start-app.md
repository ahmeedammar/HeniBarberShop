---
description: How to start the Barbershop Booking Application
---

To run the application, follow these steps:

1. **Install Dependencies**
   ```powershell
   # In the root directory (frontend)
   npm install
   
   # In the server directory
   cd server
   npm install
   cd ..
   ```

2. **Start the Backend Server**
   ```powershell
   // turbo
   cd server
   npm run dev
   ```
   *The server will run on http://localhost:3001*

3. **Start the Frontend Application**
   ```powershell
   // turbo
   npm run dev
   ```
   *The app will run on http://localhost:5173 (or similar)*

### Default Admin Credentials
- **Email:** `admin@barbershop.com`
- **Password:** `admin123`
