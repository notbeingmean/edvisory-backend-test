# ระบบบันทึกบัญชีรายรับรายจ่าย

ระบบบันทึกบัญชีรายรับรายจ่าย สำหรับบันทึกข้อมูลรายรับรายจ่ายของผู้ใช้งาน โดยผู้ใช้งานสามารถเพิ่มบัญชีประเภทบัญชี รายรับ รายจ่าย และสามารถดูรายงานรายรับรายจ่ายได้

## ระบบหลัก

- [x] ระบบ login
- [x] ระบบเพิ่ม ลบ บัญชีใชจ้่าย
- [x] ระบบเพิ่ม ลบ ประเภทของการใช้จ่าย
- [x] ระบบสรุปยอดใช้จ่าย
- [x] ระบบ filter เดือน, ปี, ประเภท, บัญชี
- [x] ระบบแนบ transaction slip หรือหลักฐานการใข้จ่าย (เป็นไฟล์ภาพ)
- [x] ระบบ note ว่า transaction นั้นทําอะไร
  - [x] มีระบบจัดการคําหยาบโดยให้แปลงคําหยาบเป็น \*\*\* แทน
- [x] หาก api ต้องคืนค่าเป็น list ให้คืนเป็น pagination หรือ infinite scroll
  - [x] เลือกไดว้่าจะให้คืนข้อมูล 10, 20, 50, 100 ข้อมูลต่อหน้า

## ระบบที่คิดว่าจะพัฒนาต่อ

- [ ] ระบบรองรับหลายภาษา
- [ ] ระบบ import ข้อมูลจากไฟล์ excel, csv หรือ json
- [ ] ระบบ export ข้อมูลเป็นไฟล์ excel, csv หรือ json
- [ ] ระบบจดจํา device ที่ทําการ login และสามารถกดออกจากระบบทุก device ไดใ้นการจัดการ security ของ
      account

## แนวคิดในการพัฒนาระบบ

ในตอนแรกผมจะเริ่มที่ดูจาก Requirement ของระบบ และจะเริ่มที่การออกแบบฐานข้อมูลโดยมีการคิดว่าจะมีการใช้งานของระบบอย่างไร และจะมีการเก็บข้อมูลอะไรบ้าง และจะมีการเชื่อมต่อกับฐานข้อมูลอย่างไร สิ่งแรกที่แล่นเข้ามาคืออยากจะให้ระบบนี้เป็นระบบที่สามารถใช้งานได้ง่าย โดยผมเลือกที่ใช้ Postgresql ในการพัฒนาฐานข้อมูล โดยมีการเก็บข้อมูลดังนี้

### ความสัมพันธ์ระหว่างตาราง

- **User**

  - `id` (Primary Key, UUID)
  - `name` (varchar, unique)
  - `email` (varchar, unique)
  - `password` (varchar)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
  - **Relationships**:
    - One-to-Many with **Account**
    - One-to-Many with **Category**
    - One-to-Many with **Transaction**

- **Account**

  - `id` (Primary Key, UUID)
  - `accountName` (varchar)
  - `balance` (decimal)
  - `userId` (Foreign Key, UUID, references `User.id`)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
  - **Relationships**:
    - Many-to-One with **User**
    - One-to-Many with **Transaction**

- **Category**

  - `id` (Primary Key, UUID)
  - `name` (varchar)
  - `userId` (Foreign Key, UUID, references `User.id`)
  - **Relationships**:
    - Many-to-One with **User**
    - Many-to-Many with **Transaction**

- **Transaction**

  - `id` (Primary Key, UUID)
  - `type` (enum: "INCOME", "EXPENSE")
  - `amount` (decimal)
  - `imageUrl` (varchar, nullable)
  - `note` (varchar, nullable)
  - `accountId` (Foreign Key, UUID, references `Account.id`)
  - `createdAt` (timestamp)
  - `updatedAt` (timestamp)
  - **Relationships**:
    - Many-to-One with **Account**
    - Many-to-Many with **Category**
    - Many-to-One with **User**

- **Session**

  - `expiredAt` (bigint)
  - `id` (Primary Key, varchar)
  - `json` (text)
  - `destroyedAt` (timestamp, nullable)

- **Category_Transaction** (Join Table for Many-to-Many relationship between Category and Transaction)
  - `categoryId` (Foreign Key, UUID, references `Category.id`)
  - `transactionId` (Foreign Key, UUID, references `Transaction.id`)

หลังจากที่ออกแบบฐานข้อมูลเสร็จแล้วใน step ถัดไปคือการเริ่มที่การเขียนโค้ด โดยผมจะเริ่มที่การเขียนโค้ดจากการเขียน API ของระบบ โดยจะเริ่มที่การเขียน API ที่จำเป็นต้องใช้งานก่อน โดยจะเริ่มที่การเขียน API ของ User และ Session ก่อน และจะเริ่มที่การเขียน API ของ Account และ Category และ Transaction ตามลำดับ

### เทคโนโลยีที่ใช้ในการพัฒนาระบบ

- [Node.js](https://nodejs.org/en/) เป็น runtime ที่ใช้ในการรันโค้ด
- [Typescript](https://www.typescriptlang.org/) เป็นภาษาที่ใช้ในการเขียนโค้ด
- [Fastify](https://www.fastify.io/) เป็น web framework ที่ใช้ในการพัฒนา API
- [Postgresql](https://www.postgresql.org/) เป็นฐานข้อมูลที่ใช้ในการเก็บข้อมูล
- [TypeORM](https://typeorm.io/) เป็น ORM ที่ใช้ในการเขียน query ของฐานข้อมูล
- [Docker](https://www.docker.com/) เป็นเครื่องมือที่ใช้ในการสร้าง container ของระบบ
- [Supabase](https://supabase.io/) ใช้เป็น Storage ของระบบ
- [Joi](https://joi.dev/) เป็น library ที่ใช้ในการ validate ข้อมูล

### Environment Variables

```bash
# PostgreSQL Configuration
POSTGRES_DB=         # Database name
POSTGRES_USER=       # Database username
POSTGRES_PASSWORD=   # Database password
POSTGRES_HOST=       # Database host address
POSTGRES_PORT=       # Database port number

# Application Configuration
PORT=                # Server port number
SALT_ROUNDS=         # Number of salt rounds for password hashing

# Security
SESSION_SECRET=      # Secret key for session management

# Supabase Configuration
SUPABASE_URL=        # Supabase project URL
SUPABASE_ANON_KEY=   # Supabase anonymous key
```

### วิธีการเรียกใช้งาน

1.  Clone repository นี้

```bash
git clone https://github.com/notbeingmean/edvisory-backend-test.git
```

2.  สร้างไฟล์ `.env` และกำหนดค่า environment variables ตามที่กล่าวถึงข้างต้น
3.  รันคำสั่ง

```bash
npm install

# OR using yarn
yarn install

# OR using pnpm
pnpm install
```

4.  เริ่มที่การรัน server

```bash
npm run dev

# OR using yarn
yarn dev

# OR using pnpm
pnpm run dev
```

OR using Docker

```bash
docker-compose up
```

### ทดสอบ API

ในการทดสอบ API ของระบบ สามารถใช้งานได้ผ่าน Insomnia โดยนำไฟล์ `Insomnia.json` มา import ในโปรแกรม Insomnia และทดสอบ API ของระบบได้ หรือสามารถใช้งานผ่าน Swagger ได้โดยเข้าไปที่ `http://localhost:3000/documentation` หลังจากที่รัน server แล้ว หรือสามารถทำการทดสอบผ่าน Endpoint ต่างๆ ดังนี้

- **Authentication**

  - `POST /api/auth/signup` สำหรับการสร้าง User
    - สามารถสร้าง User ได้โดยส่งข้อมูลไปยัง Body ดังนี้
      - `name` (string)
      - `email` (string)
      - `password` (string)
  - `POST /api/auth/signin` สำหรับการ login
    - สามารถเข้าสู่ระบบ ได้โดยส่งข้อมูลดังนี้
      - `email` (string)
      - `password` (string)
  - `POST /api/auth/signout` สำหรับการ logout

- **Account** (Require Authentication)
- `GET /api/account` สำหรับดึงข้อมูล Account ทั้งหมดของ User
  - Query Parameters:
    - `page` (number, default: 1)
    - `limit` (number, default: 10)
- `POST /api/account` สำหรับการสร้าง Account
  - สามารถสร้าง Account ได้โดยส่งข้อมูลไปยัง Body ดังนี้
    - `accountName` (string)
    - `balance` (number)
- `GET /api/account/:id` สำหรับดึงข้อมูล Account ตาม ID
- `PATCH /api/account/:id` สำหรับการอัพเดทข้อมูล Account ตาม ID
  - สามารถอัพเดทข้อมูล Account ได้โดยส่งข้อมูลไปยัง Body ดังนี้
    - `accountName` (string)
    - `balance` (number)
- `DELETE /api/account/:id` สำหรับการลบ Account ตาม ID

- **Transaction** (Require Authentication)
- `GET /api/transaction` สำหรับดึงข้อมูล Transaction ทั้งหมดของ User
  - Query Parameters:
    - `page` (number, default: 1)
    - `limit` (number, default: 10)
    - `type` (string, enum: "INCOME", "EXPENSE")
    - `accountId` (string)
    - `categories` (array of string)
    - `startDate` (string, format: "DD-MM-YYYY")
    - `endDate` (string, format: "DD-MM-YYYY")
  - Example: `/api/transaction?page=1&limit=10&type=INCOME&accountId=1&categories=shopping&categories=travel&startDate=01-01-2022&endDate=31-01-2022`
- `GET /api/transaction/:id` สำหรับดึงข้อมูล Transaction ตาม ID (string)
- `POST /api/transaction` สำหรับการสร้าง Transaction
  - สามารถสร้าง Transaction ได้โดยส่งข้อมูลไปยัง Body ดังนี้
    - `type` (string, enum: "INCOME", "EXPENSE")
    - `amount` (number)
    - `imageUrl` (string, nullable)
    - `note` (string, nullable)
    - `accountId` (string)
    - `categories` (array of string)
  - Example:
    ```json
    {
      "type": "INCOME",
      "amount": 1000,
      "imageUrl": "https://example.com/image.jpg",
      "note": "This is a note",
      "accountId": "1",
      "categories": ["shopping", "travel"]
    }
    ```
- `PATCH /api/transaction/:id` สำหรับการอัพเดทข้อมูล Transaction ตาม ID
  - สามารถอัพเดทข้อมูล Transaction ได้โดยส่งข้อมูลไปยัง Body ดังนี้
    - `type` (string, enum: "INCOME", "EXPENSE")
    - `amount` (number)
    - `imageUrl` (string, nullable)
    - `note` (string, nullable)
    - `categories` (array of string)
- `DELETE /api/transaction/:id` สำหรับการลบ Transaction ตาม ID

- **Transaction Slip** (Require Authentication)
- `POST /api/transaction/{transactionId}/upload-slip` สำหรับการอัพโหลด Slip ของ Transaction
  - สามารถอัพโหลด Slip ได้โดยส่งไฟล์ไปยัง Multipart/FormData ดังนี้
    - `file` (file)
- `DELETE /api/transaction/{transactionId}/delete-slip` สำหรับการลบ Slip ของ Transaction

- **Account Summary** (Require Authentication)
- `GET /api/account/summary` สำหรับดึงข้อมูล Account Summary ของ User
  - Query Parameters:
    - `month` (string)
    - `year` (string)
    - `page` (string)
    - `limit` (string)
    - `tags` (array of string)
  - Example: `/api/account/summary?month=01&year=2022&page=1&limit=10&tags=shopping&tags=travel`
- `GET /api/account/:accountId/summary` สำหรับดึงข้อมูล Account Summary ตาม Account ID

  - Query Parameters:
    - `month` (string)
    - `year` (string)
    - `page` (string)
    - `limit` (string)
    - `tags` (array of string)
  - Example: `/api/account/1/summary?month=01&year=2022&page=1&limit=10&tags=shopping&tags=travel`

- **Account Calculation** (Require Authentication)
- `GET /api/account/:accountId/calculate` สำหรับคำนวณยอด Account ตาม Account ID
  - Query Parameters:
    - `budget` (number)
  - Example: `/api/account/1/calculate?budget=10000`
  - Response:
    ```json
    {
      "totalIncome": 0,
      "totalExpense": 4000,
      "initialBalance": 58000,
      "remainingBalance": 54000,
      "dailyBudget": 2500,
      "remainingDays": 4
    }
    ```

### Import และ Export ข้อมูล

ในการ import และ export ข้อมูล สามารถทำได้ผ่าน API ดังนี้:

- **Import Data** (Require Authentication)

  - `POST /api/data/import` สำหรับการ import ข้อมูล
    - สามารถ import ข้อมูลได้โดยส่งไฟล์ไปยัง Multipart/FormData ดังนี้
      - `file` (file, required) - ไฟล์ข้อมูลที่ต้องการ import (รองรับไฟล์ประเภท CSV, Excel, JSON)

- **Export Data** (Require Authentication)
  - `GET /api/data/export` สำหรับการ export ข้อมูล
    - Query Parameters:
      - `format` (string, required) - รูปแบบไฟล์ที่ต้องการ export (รองรับ CSV, Excel, JSON)
