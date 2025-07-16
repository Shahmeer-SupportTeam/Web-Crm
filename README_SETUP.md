# Web CRM Database Setup Guide

## Prerequisites
1. **Install XAMPP** (includes Apache, MySQL, PHP)
   - Download from: https://www.apachefriends.org/download.html
   - Install with default settings

## **After Installing XAMPP:**

### **Step 1: Start the Services**
1. Open **XAMPP Control Panel** (search for it in Start menu)
2. Click **Start** next to **Apache**
3. Click **Start** next to **MySQL**
4. Both should turn green and say "Running"

### **Step 2: Move Your Project**
1. Copy your `Web CRM` folder from Desktop to:
   ```
   C:\xampp\htdocs\Web CRM\
   ```

### **Step 3: Set Up Database**
1. Open your browser and go to: `http://localhost/phpmyadmin`
2. Click on **SQL** tab
3. Copy and paste this code:
   ```sql
   CREATE DATABASE IF NOT EXISTS shopledger;
   CREATE USER IF NOT EXISTS 'SHAHMEER'@'localhost' IDENTIFIED BY '112003';
   GRANT ALL PRIVILEGES ON shopledger.* TO 'SHAHMEER'@'localhost';
   FLUSH PRIVILEGES;
   ```
4. Click **Go** to execute

### **Step 4: Import Your Database**
1. In phpMyAdmin, click on the **shopledger** database
2. Click **Import** tab
3. Click **Choose File** and select your `shopledger.sql` file
4. Click **Go** to import

### **Step 5: Test Your Connection**
1. Open your browser and go to:
   ```
   http://localhost/Web%20CRM/php/test_db.php
   ```
2. You should see a JSON response showing if the connection works

### **Step 6: Access Your Main Application**
1. Go to: `http://localhost/Web%20CRM/`
2. You should see your login page

---

**Let me know when you've completed these steps and what happens!** If you get any errors, share them with me and I'll help you fix them.

## Alternative: Using MySQL Command Line

If you prefer command line:

1. Open Command Prompt as Administrator
2. Navigate to MySQL bin directory:
   ```
   cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
   ```

3. Connect as root (you'll need the root password):
   ```
   mysql -u root -p
   ```

4. Run the setup commands from `setup_database.sql`

5. Import the database:
   ```
   mysql -u SHAHMEER -pshahmeer shopledger < "C:\path\to\your\shopledger.sql"
   ```

## Troubleshooting

### Common Issues:
1. **Access denied for user 'SHAHMEER'**
   - Solution: Create the user using the SQL commands above

2. **Database 'shopledger' doesn't exist**
   - Solution: Create the database using the SQL commands above

3. **PHP not found**
   - Solution: Install XAMPP or add PHP to your system PATH

4. **Port 3306 already in use**
   - Solution: Stop other MySQL services or change the port

### Test Your Setup:
1. Open: `http://localhost/Web%20CRM/php/test_db.php`
2. You should see a JSON response indicating success

## File Structure After Setup:
```
C:\xampp\htdocs\Web CRM\
├── css/
├── js/
├── php/
│   ├── db_connect.php
│   ├── auth.php
│   └── test_db.php
├── index.html
└── shopledger.sql
``` 