# Hotel Data Merge

A NestJS application for merging and managing hotel data from multiple suppliers.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker Compose](#quick-start-with-docker-compose)
- [Manual Setup](#manual-setup)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Development](#development)
- [Testing](#testing)
- [Database Operations](#database-operations)
- [Project Structure](#project-structure)

## 🎯 Overview

This application aggregates hotel data from multiple suppliers (ACME, Patagonia, Paperflies) and provides a unified API for accessing hotel information with features like:

- Data merging from multiple suppliers
- Scheduled data processing
- RESTful API for hotel queries
- Database migrations and seeding
- Comprehensive test coverage

## 📋 Prerequisites

- **Docker & Docker Compose** (recommended) OR
- **Node.js** (v18+ or v20+)
- **PostgreSQL** (v15+)
- **npm** or **yarn**

## 🚀 Quick Start with Docker Compose

### 1. Clone the repository
```bash
git clone <repository-url>
cd hotel-data-merge
```

### 2. Start the application
```bash
docker-compose up --build
```

This will:
- Build the application container
- Start PostgreSQL database
- Run database migrations
- Start the application on `http://localhost:3000`

### 3. Stop the application
```bash
docker-compose down
```

### 4. Reset everything (including database data)
```bash
docker-compose down -v
docker-compose up --build
```

## 🔧 Manual Setup

### 1. Clone and install dependencies
```bash
git clone <repository-url>
cd hotel-data-merge
npm install
```

### 2. Set up PostgreSQL database
Ensure PostgreSQL is running and create a database:
```sql
CREATE DATABASE hotel_management;
CREATE USER hotel_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hotel_management TO hotel_user;
```

### 3. Configure environment variables
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=hotel_user
DB_PASSWORD=your_password
DB_NAME=hotel_management

# Optional: Supplier API URLs (defaults provided)
ACME_BASE_URL=https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/acme
PATAGONIA_BASE_URL=https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/patagonia
PAPERFLIES_BASE_URL=https://5f2be0b4ffc88500167b85a0.mockapi.io/suppliers/paperflies

# Environment
NODE_ENV=development
```

### 4. Run database migrations
```bash
npm run migration:up
```

### 5. Start the application
```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will be available at `http://localhost:3000`

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | ✅ | `localhost` | Database host |
| `DB_PORT` | ✅ | `5432` | Database port |
| `DB_USERNAME` | ✅ | - | Database username |
| `DB_PASSWORD` | ✅ | - | Database password |
| `DB_NAME` | ✅ | `hotel-management` | Database name |
| `NODE_ENV` | ❌ | `development` | Environment mode |
| `ACME_BASE_URL` | ❌ | Mock API URL | ACME supplier API endpoint |
| `PATAGONIA_BASE_URL` | ❌ | Mock API URL | Patagonia supplier API endpoint |
| `PAPERFLIES_BASE_URL` | ❌ | Mock API URL | Paperflies supplier API endpoint |

## 🔌 API Endpoints

### Hotels
- `GET /hotels` - Get paginated list of hotels
  - Query parameters:
    - `hotel_ids[]`: Filter by specific hotel IDs
    - `destination_id`: Filter by destination ID
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10, max: 100)

Example:
```bash
# Get all hotels
curl "http://localhost:3000/hotels"

# Get hotels with pagination
curl "http://localhost:3000/hotels?page=2&limit=5"

# Filter by destination
curl "http://localhost:3000/hotels?destination_id=5432"

# Filter by hotel IDs
curl "http://localhost:3000/hotels?hotel_ids[]=iJhz&hotel_ids[]=SjyX"
```

### Data Processing
- `POST /scheduler/trigger` - Manually trigger data processing from suppliers

## 💻 Development

### Available Scripts

```bash
# Development
npm run start:dev      # Start with hot reload
npm run start:debug    # Start in debug mode

# Building
npm run build          # Build the application
npm run start:prod     # Run production build

# Code Quality
npm run lint           # Fix linting issues
npm run lint:check     # Check linting without fixing
npm run format         # Format code with Prettier

# Testing
npm run test           # Run unit tests
npm run test:watch     # Run tests in watch mode
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run end-to-end tests
npm run test:debug     # Debug tests
```

### Database Scripts

```bash
# Migrations
npm run migration:create  # Create new migration
npm run migration:up      # Apply migrations
npm run migration:down    # Rollback migrations

# Schema
npm run schema:create     # Create database schema
npm run schema:drop       # Drop database schema

# Cache
npm run cache:clear       # Clear MikroORM cache
```

## 🧪 Testing

### Unit Tests
```bash
npm run test
npm run test:cov  # with coverage
```

### E2E Tests
```bash
npm run test:e2e
```

### CI/CD
The project includes GitHub Actions workflows for:
- Running tests on Node.js 18.x and 20.x
- Docker image building
- Code coverage reporting

## 🗄️ Database Operations

### Running Migrations
```bash
# Apply all pending migrations
npm run migration:up

# Rollback last migration
npm run migration:down

# Create a new migration
npm run migration:create
```

### Database Reset
```bash
# Drop and recreate schema
npm run schema:drop
npm run schema:create
npm run migration:up
```

## 📁 Project Structure

```
src/
├── api/                 # API controllers and modules
│   ├── hotels/         # Hotels API endpoints
│   └── scheduler/      # Data processing endpoints
├── config/             # Configuration files
├── constants/          # Application constants
├── db/
│   ├── entities/       # Database entities
│   ├── migrations/     # Database migrations
│   └── seeders/        # Database seeders
├── dto/                # Data Transfer Objects
├── pipes/              # Custom pipes
├── provider/           # External data providers
│   └── suppliers/      # Supplier integrations
├── scheduler/          # Scheduled tasks
├── transformers/       # Data transformers
└── utils/              # Utility functions

test/                   # E2E tests
docker-compose.yml      # Docker Compose configuration
Dockerfile             # Docker configuration
mikro-orm.config.ts    # Database configuration
```

## 🏗️ Architecture

The application follows a modular architecture with:

- **API Layer**: RESTful endpoints using NestJS controllers
- **Service Layer**: Business logic and data processing
- **Data Layer**: MikroORM entities and repositories
- **Provider Layer**: External supplier integrations
- **Scheduler**: Automated data processing tasks

## 📝 Notes

- The application uses scheduled tasks to periodically fetch and merge data from suppliers
- Data is automatically merged based on hotel IDs, with intelligent handling of conflicting information
- The API supports pagination and filtering for efficient data retrieval
- All database operations are wrapped in transactions for data consistency
