# User Transaction System - Quick Start Guide

## Getting Started

### 1. Start the Application

**Terminal 1 - Backend:**
```bash
cd quest/Application/backend
npm install  # (if not already done)
npm start
# Backend running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd quest/Application/frontend
npm install  # (if not already done)
npm run dev
# Frontend running on http://localhost:3000
```

### 2. Login as Customer

Navigate to `http://localhost:3000`

**Login Credentials:**
```
Username: testuser
Password: password123
```

---

## User Features Walkthrough

### Feature 1: My Dashboard (Balance & Quick Actions)

**Path:** Dashboard → My Dashboard (after login as customer)

**What You'll See:**
- Blue gradient card showing current balance
- Three action buttons: Deposit, Withdraw, Transfer
- Recent transactions table with last 5 transactions

**Try It:**
1. Click "Deposit" button
2. Enter amount (e.g., 500)
3. Click "Deposit" in modal
4. See balance increase
5. Check "Recent Transactions" table

---

### Feature 2: Send Money (New!)

**Path:** Dashboard → Send Money

**Steps to Send Money:**

#### Step 1: Fill the Form
```
Transaction Type: Select "Transfer" or "Payment"
Recipient Email/Account: Enter "ACC001" or "user@example.com"
Amount: Enter amount in USD (e.g., 100.00)
Description: Optional note (e.g., "Payment for services")
```

#### Step 2: Review
- Click "Send Money" button
- Modal opens showing transaction summary
- Review all details:
  - Recipient: (shows your entry)
  - Amount: $XXX.XX
  - Type: Transfer/Payment
  - Description: (if entered)
  - New Balance: (calculated automatically)
- Click "Confirm & Send"

#### Step 3: Processing
- See spinning loader
- Modal shows "Processing your transaction..."
- Wait for completion (2-3 seconds)

#### Step 4: Success
- Green checkmark appears
- Message: "Transaction Successful!"
- Shows: "$XXX.XX has been sent to [recipient]"
- Click "Done" to close

**Example:**
```
Send $250 to ACC002
└─ Modal shows:
   └─ Recipient: ACC002
   └─ Amount: $250.00
   └─ Description: (empty)
   └─ New Balance: $750.00 (if current = $1000)
   └─ Success! Transaction complete
   └─ Check transaction history
```

---

### Feature 3: Transaction History

**Path:** Dashboard → My Transactions

**What You'll See:**
- Complete history of all transactions
- Columns: Date, Type, Recipient/Sender, Description, Amount, Status
- Color-coded status tags (Completed=green, Pending=orange)
- Sortable and filterable table
- Pagination (10 rows per page)

**Transaction Types:**
```
🔵 Transfer  - Money sent to another account
🔵 Payment   - Payment transaction
🟢 Deposit   - Money added to account
🔴 Withdraw  - Money withdrawn from account
```

**Status Indicators:**
```
🟢 Completed - Transaction successful
🟠 Pending   - Awaiting processing
🔴 Failed    - Transaction failed
```

---

## Admin Features (for reference)

### Admin Dashboard

**Path:** Dashboard (logged in as admin)

Shows:
- Total Accounts
- Flagged Transactions
- Total Volume
- Total Transactions

### Network Explorer

**Path:** Network Explorer

Shows:
- Interactive fraud network graph
- Connected accounts and relationships
- High-risk transactions highlighted
- Zoom and pan controls

### Transaction Monitoring

**Path:** Transactions (as admin)

Features:
- All transactions from all users
- Search by Transaction ID or Account
- Filter by Risk Level (High, Medium, Low)
- Flag suspicious transactions (red "Flag" button)
- See risk indicators

### Risk Analysis

**Path:** Click on any transaction ID

Shows:
- Deep-dive risk analysis
- Risk score with progress circle
- 6 risk factors with scores:
  - Velocity Score
  - Amount Anomaly
  - Device Match
  - Location Risk
  - Recipient Risk
  - Network Risk
- Transaction timeline
- Audit logs
- Action buttons: Block Account, Approve, etc.

---

## Common Tasks

### How to: Deposit Money

1. Go to "My Dashboard"
2. Click blue "Deposit" button
3. Enter amount
4. Click "Deposit"
5. Check balance update

### How to: Check Recent Transactions

1. Go to "My Dashboard"
2. Scroll down to "Recent Transactions"
3. See last 5 transactions

### How to: Send Money to Another Account

1. Go to "Send Money"
2. Fill form:
   - Type: Transfer
   - Recipient: ACC001 or email@domain.com
   - Amount: $100.00
   - Description: (optional)
3. Click "Send Money"
4. Review in modal
5. Confirm transaction
6. See success message

### How to: Check All Transactions

1. Go to "My Transactions"
2. View full history table
3. Search by ID or account
4. Filter by type
5. Sort by date/amount

### How to: Understand Transaction Risk

Look for color tags:
- 🟢 **Green** = Low risk (safe)
- 🟠 **Orange** = Medium risk (review)
- 🔴 **Red** = High risk (flagged)

---

## API Endpoints (Backend)

### Customer Transactions

```
POST /api/transactions/create
Request:
{
  "recipientEmail": "user@email.com",
  "amount": 100,
  "description": "Payment",
  "type": "transfer"
}

Response:
{
  "success": true,
  "id": "TXN-1234567890",
  "message": "Transaction created successfully",
  "transaction": {
    "id": "TXN-1234567890",
    "amount": 100,
    "recipient": "ACC_user_email_com",
    "description": "Payment",
    "type": "transfer",
    "timestamp": "2026-05-08T...",
    "status": "Completed"
  }
}
```

```
GET /api/transactions
Returns array of all transactions with:
- transaction_id
- fromAccount
- toAccount
- amount
- date
- status
- risk (High/Medium/Low)
```

```
GET /api/accounts/balance
Returns:
{
  "balance": 1000.00
}
```

---

## Troubleshooting

### Issue: "Insufficient balance" error
**Solution:** You don't have enough funds. Check your balance on My Dashboard.

### Issue: "Invalid recipient" error
**Solution:** Use format: `ACC001` or `user@email.com`

### Issue: Transaction not appearing in history
**Solution:** Refresh the page or wait a few seconds. Check "My Transactions" page.

### Issue: "Server error" message
**Solution:** Make sure backend is running on localhost:5000

### Issue: Can't access "Send Money" page
**Solution:** You must be logged in as a customer (role: customer)

### Issue: Balance not updating
**Solution:** Refresh the page or go back to dashboard and return

---

## Test Scenarios

### Scenario 1: Basic Transfer
```
1. Login as testuser
2. Check balance (should be ~$1000)
3. Go to Send Money
4. Transfer $100 to ACC002
5. Verify success
6. Check new balance ($900)
7. View in transaction history
```

### Scenario 2: High-Value Transaction (Fraud Detection)
```
1. Login as testuser
2. Go to Send Money
3. Transfer $15,000 to ACC999
4. Complete transaction
5. Login as admin
6. Go to Transactions
7. Look for $15,000 transaction
8. Should show "High" risk (red tag)
9. Click Flag button
10. Transaction flagged successfully
```

### Scenario 3: Multiple Transactions
```
1. Send $50 (transfer type)
2. Send $200 (payment type)
3. Deposit $500
4. Withdraw $100
5. Check My Transactions
6. Verify all 4 appear in history
7. Verify colors and types match
```

---

## Key Metrics to Monitor

### Transaction Statistics
- Total balance
- Number of transactions
- Transaction types breakdown
- Risk distribution

### Fraud Detection
- High-risk transactions automatically flagged
- Medium-risk transactions highlighted
- Low-risk transactions proceed normally
- Risk scores based on:
  - Transaction amount
  - Recipient account
  - Device used
  - Location
  - Time of day
  - Velocity (how many transactions)

---

## Security Reminders

✅ **Always:**
- Log out when done
- Verify recipient email/account before sending
- Use strong passwords
- Report suspicious transactions

❌ **Never:**
- Share your login credentials
- Send money to unknown recipients
- Ignore fraud alerts
- Click suspicious links

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the transaction data validation rules
3. Check backend logs for errors
4. Verify .env file has correct Neo4j credentials

---

## Summary

The user transaction system provides:
✅ Easy money transfer
✅ Account management
✅ Transaction history
✅ Real-time fraud detection
✅ Multi-step confirmation
✅ Secure authentication

Enjoy using the Quest Fraud Detection & Banking System! 🚀
