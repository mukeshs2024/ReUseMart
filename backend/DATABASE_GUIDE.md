# ReUseMart Database Documentation

## Current Status
- **Database**: PostgreSQL (Supabase)
- **Tables**: 6 main tables (User, Product, Order, Offer, Message, Rating)
- **Status**: Tables exist but data may not be storing correctly

---

## TABLE 1: User
**Purpose**: Store user accounts (buyers and sellers)

### Required Columns
| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | ✅ | uuid() | Primary Key |
| name | TEXT | ✅ | - | User's full name |
| email | TEXT | ✅ | - | UNIQUE - user's email |
| password | TEXT | ✅ | - | Hashed password |
| role | ENUM | ✅ | 'USER' | USER or ADMIN |
| userType | ENUM | ✅ | 'BUYER' | BUYER, SELLER, or BOTH |
| isSeller | BOOLEAN | ✅ | false | Is this account a seller? |
| phone | TEXT | ❌ | null | Optional phone number |
| isPhoneVerified | BOOLEAN | ✅ | false | Is phone verified? |
| trustScore | INTEGER | ✅ | 0 | 0-100 trust score |
| sellerLevel | ENUM | ✅ | 'BASIC' | BASIC, VERIFIED, TRUSTED, PRO |
| activeMode | ENUM | ✅ | 'BUYER' | BUYER or SELLER mode |
| avatarUrl | TEXT | ❌ | null | Profile picture URL |
| createdAt | TIMESTAMP | ✅ | now() | Account creation date |

### Expected Data
```sql
-- Should have at least:
- 1 ADMIN account
- 7-10 SELLER accounts (isSeller = true)
- 3-10 BUYER accounts
```

---

## TABLE 2: Product
**Purpose**: Store products for sale

### Required Columns
| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | ✅ | uuid() | Primary Key |
| title | TEXT | ✅ | - | Product title |
| description | TEXT | ✅ | - | Full description |
| price | FLOAT | ✅ | - | Price in rupees |
| stock | INTEGER | ✅ | 1 | Units available (should be ≥ 1) |
| usageYears | INTEGER | ✅ | 0 | How long it's been used |
| category | ENUM | ✅ | 'ELECTRONICS' | ELECTRONICS, MOBILES, FURNITURE, FASHION, ACCESSORIES |
| condition | ENUM | ✅ | 'USED' | LIKE_NEW, USED, OLD, TOO_OLD |
| imageUrl | TEXT | ✅ | - | Product image URL |
| sellerId | TEXT | ✅ | - | Foreign key → User.id |
| paymentQrCode | TEXT | ❌ | null | QR code image URL |
| paymentQrText | TEXT | ❌ | null | Data encoded in QR |
| createdAt | TIMESTAMP | ✅ | now() | Product creation date |

### Expected Data
```sql
-- Should have:
- 20-30+ products
- Each with valid sellerId (must exist in User table)
- stock ≥ 1 for all products
- Valid category and condition
- All fields filled in properly
```

---

## TABLE 3: Order
**Purpose**: Store purchase orders

### Required Columns
| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | ✅ | uuid() | Primary Key |
| productId | TEXT | ✅ | - | Foreign key → Product.id |
| buyerId | TEXT | ✅ | - | Foreign key → User.id (buyer) |
| sellerId | TEXT | ✅ | - | Foreign key → User.id (seller) |
| quantity | INTEGER | ✅ | 1 | How many units |
| amount | FLOAT | ✅ | - | Total price paid |
| status | ENUM | ✅ | 'PENDING' | PENDING, COMPLETED, CANCELLED |
| createdAt | TIMESTAMP | ✅ | now() | Order creation date |

### Data Storage Issues
❌ **Common Problems**:
- Orders referencing products that don't exist
- Orders referencing users that don't exist
- Amount = 0 or negative
- Quantity = 0 or negative

✅ **Fix**: Run cleanup query to delete broken orders

---

## TABLE 4: Offer
**Purpose**: Store buyer offers on products

### Required Columns
| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | ✅ | uuid() | Primary Key |
| productId | TEXT | ✅ | - | Foreign key → Product.id |
| buyerId | TEXT | ✅ | - | Foreign key → User.id (buyer) |
| sellerId | TEXT | ✅ | - | Foreign key → User.id (seller) |
| price | FLOAT | ✅ | - | Offered price |
| message | TEXT | ❌ | null | Optional offer message |
| status | ENUM | ✅ | 'PENDING' | PENDING, ACCEPTED, DECLINED |
| createdAt | TIMESTAMP | ✅ | now() | Offer creation date |
| updatedAt | TIMESTAMP | ✅ | now() | Last updated date |

### Data Storage Issues
❌ **Common Problems**:
- Offers referencing non-existent products
- Offers from seller to themselves (buyerId = sellerId)
- Invalid foreign keys

✅ **Fix**: Run cleanup query to delete broken offers

---

## TABLE 5: Message
**Purpose**: Store buyer-seller chat messages

### Required Columns
| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | ✅ | uuid() | Primary Key |
| content | TEXT | ✅ | - | Message text |
| senderType | ENUM | ✅ | 'BUYER' | BUYER or SELLER |
| buyerId | TEXT | ✅ | - | Foreign key → User.id |
| sellerId | TEXT | ✅ | - | Foreign key → User.id |
| productId | TEXT | ✅ | - | Foreign key → Product.id |
| isRead | BOOLEAN | ✅ | false | Has this been read? |
| createdAt | TIMESTAMP | ✅ | now() | Message creation date |

### Data Storage Issues
❌ **Common Problems**:
- Empty content messages
- Invalid user references
- Invalid product references
- Both buyer and seller being the same user

✅ **Fix**: Run cleanup query to delete broken messages

---

## TABLE 6: Rating
**Purpose**: Store buyer ratings for sellers/products

### Required Columns
| Column | Type | Required | Default | Notes |
|--------|------|----------|---------|-------|
| id | TEXT | ✅ | uuid() | Primary Key |
| productId | TEXT | ❌ | null | Foreign key → Product.id (optional) |
| buyerId | TEXT | ✅ | - | Foreign key → User.id (who rated) |
| sellerId | TEXT | ❌ | null | Foreign key → User.id (who was rated) |
| rating | INTEGER | ✅ | - | 1-5 star rating |
| comment | TEXT | ❌ | null | Optional review comment |
| createdAt | TIMESTAMP | ✅ | now() | Rating creation date |

### Data Storage Issues
❌ **Common Problems**:
- Rating values outside 1-5 range
- Invalid user references
- Self-ratings (buyerId = sellerId)

✅ **Fix**: Run cleanup query to delete broken ratings

---

## Data Storage Issues & Solutions

### Issue 1: Database Connection Down
**Symptom**: "Can't reach database server"
**Cause**: Supabase database offline or connection string incorrect
**Solution**:
```bash
# Check .env file has correct DATABASE_URL
cat .env | grep DATABASE_URL

# Verify connection works
npx prisma db push
```

### Issue 2: Foreign Key Violations
**Symptom**: Orders/Offers/Messages not storing
**Cause**: Referencing users/products that don't exist
**Solution**: Run the cleanup queries in DATABASE_FIX.sh

### Issue 3: Invalid Data in Fields
**Symptom**: Products with stock = 0, prices negative, etc.
**Cause**: Validation not enforced at database level
**Solution**: Run cleanup queries to fix values

### Issue 4: Missing Tables
**Symptom**: "Table X does not exist"
**Cause**: Migrations not applied
**Solution**:
```bash
cd backend
npx prisma migrate deploy
```

---

## How to Verify Data is Storing Correctly

### Step 1: Check Database Connection
```bash
cd backend
npx prisma db execute --stdin < DATABASE_FIX.sh
```

### Step 2: Run SQL Verification (in Supabase SQL Editor)
```sql
-- Count all records
SELECT 'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL SELECT 'Product', COUNT(*) FROM "Product"
UNION ALL SELECT 'Order', COUNT(*) FROM "Order"
UNION ALL SELECT 'Offer', COUNT(*) FROM "Offer"
UNION ALL SELECT 'Message', COUNT(*) FROM "Message"
UNION ALL SELECT 'Rating', COUNT(*) FROM "Rating";
```

### Step 3: Check for Broken References
```sql
-- Find products with missing sellers
SELECT COUNT(*) as broken_products
FROM "Product" WHERE "sellerId" NOT IN (SELECT id FROM "User");

-- Find orders with missing references
SELECT COUNT(*) as broken_orders
FROM "Order" WHERE "productId" NOT IN (SELECT id FROM "Product")
   OR "buyerId" NOT IN (SELECT id FROM "User")
   OR "sellerId" NOT IN (SELECT id FROM "User");
```

### Step 4: Cleanup Broken Data
Run all blocks in DATABASE_FIX.sh to clean up issues

---

## Required Tables Check

### All 6 Tables Must Exist
```
✅ User
✅ Product
✅ Order
✅ Offer
✅ Message
✅ Rating
```

### If Any Table is Missing

Run in Supabase SQL Editor:
```sql
-- Table creation SQL in database-schema.sql file
-- Copy and paste the appropriate CREATE TABLE statement
```

---

## Next Steps

1. **Open Supabase Dashboard**: https://supabase.co/dashboard
2. **Go to SQL Editor**
3. **Run DATABASE_FIX.sh blocks one by one** (copy each block, paste, run)
4. **Check results** - should show record counts
5. **Run cleanup queries** if broken data found
6. **Verify with your backend** by creating test data

---

## Contact Database Issues

If data still not storing after cleanup:

1. Check backend `.env` has correct `DATABASE_URL`
2. Check Supabase project is not paused
3. Check user has seller permission (isSeller = true)
4. Check product sellerId matches user id
5. Run `npx prisma generate` to regenerate client
6. Check backend logs for errors: `npm run dev`

---
