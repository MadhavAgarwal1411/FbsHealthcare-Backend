# FBS Backend - Role-Based Authentication API

## usefull commands
npx prisma generate    # Generate client after schema changes
npx prisma db push     # Push schema to database (dev)
npx prisma migrate dev # Create migration (production)
npx prisma studio      # Visual database browser


A Node.js backend with PostgreSQL database featuring role-based authentication with time-restricted access for employees.

## Features

- **Role-Based Access Control**: Admin and Employee roles
- **Time-Restricted Login**: Employees can only login during specified time windows
- **JWT Authentication**: Secure token-based authentication
- **Login Session Tracking**: Track login history with IP and user agent
- **User Management**: Full CRUD operations for admins
- **Prisma ORM**: Type-safe database queries with automatic SQL injection protection

## Tech Stack

- Node.js with Express.js
- PostgreSQL 16
- **Prisma ORM** (v7) - Type-safe database access
- JWT for authentication
- bcryptjs for password hashing
- express-validator for input validation

## Prerequisites

- Node.js 18+ 
- PostgreSQL 16
- npm or yarn

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your database credentials.

4. Generate Prisma client and push schema:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Start the server:
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## Default Admin Credentials

- **Email**: admin@fbs.com
- **Password**: admin123

> ⚠️ Change these credentials in production!

## Test Users

### Admin (No Time Restrictions)
```
Email: admin@fbs.com
Password: admin123
Role: admin
```

### Day Shift Employee (09:00 - 18:00)
```
Email: timetest@fbs.com
Password: test123
Role: employee
Allowed Time: 09:00 - 18:00
```

### Night Shift Employee (20:00 - 23:00)
```
Email: night@fbs.com
Password: test123
Role: employee
Allowed Time: 20:00 - 23:00
```

## Test Commands

### Login as Admin
```bash
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fbs.com", "password": "admin123"}'
```

### Login as Day Shift Employee (allowed 09:00-18:00)
```bash
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "timetest@fbs.com", "password": "test123"}'
```

### Login as Night Shift Employee (allowed 20:00-23:00)
```bash
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "night@fbs.com", "password": "test123"}'
```

### Get All Users (requires admin token)
```bash
curl -s -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer <admin_token>"
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/register` | Register new user | Admin |
| GET | `/api/auth/profile` | Get current user profile | Yes |
| POST | `/api/auth/logout` | Logout user | Yes |
| POST | `/api/auth/change-password` | Change password | Yes |

### User Management (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (with pagination) |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/users/:id/login-history` | Get user login history |
| POST | `/api/users/:id/reset-password` | Reset user password |

## Request/Response Examples

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@fbs.com",
  "password": "admin123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@fbs.com",
      "phone": "9999999999",
      "role": "admin"
    }
  }
}
```

### Register Employee with Time Restrictions
```bash
POST /api/auth/register
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@fbs.com",
  "phone": "1234567890",
  "password": "password123",
  "role": "employee",
  "loginStartTime": "09:00",
  "loginEndTime": "18:00"
}
```

### Employee Login Outside Allowed Time
If an employee tries to login outside their allowed time window:
```json
{
  "success": false,
  "message": "Login allowed only between 09:00:00 and 18:00:00",
  "currentTime": "21:30:45",
  "allowedStartTime": "09:00:00",
  "allowedEndTime": "18:00:00"
}
```

## User Roles

### Admin
- Full access to all endpoints
- Can create, update, delete users
- Can view login history
- No time restrictions

### Employee
- Can login/logout
- Can view own profile
- Can change own password
- **Subject to login time restrictions** set by admin

## Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| name | VARCHAR(100) | User's full name |
| email | VARCHAR(255) | Unique email address |
| phone | VARCHAR(20) | Phone number |
| password | VARCHAR(255) | Hashed password |
| role | ENUM | 'admin' or 'employee' |
| login_start_time | TIME | Allowed login start time |
| login_end_time | TIME | Allowed login end time |
| is_active | BOOLEAN | Account status |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### Login Sessions Table
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| user_id | INTEGER | Foreign key to users |
| login_time | TIMESTAMP | When user logged in |
| logout_time | TIMESTAMP | When user logged out |
| ip_address | VARCHAR(45) | Client IP address |
| user_agent | TEXT | Browser/client info |
| is_valid | BOOLEAN | Session validity |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| JWT_SECRET | Secret key for JWT tokens | - |
| JWT_EXPIRES_IN | Token expiration time | 24h |
| PORT | Server port | 5000 |
| NODE_ENV | Environment (development/production) | development |
| BCRYPT_SALT_ROUNDS | Password hashing rounds | 12 |

## License

MIT
