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
├── api/                # API controllers and modules
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
Dockerfile              # Docker configuration
mikro-orm.config.ts     # Database configuration
```


## 🧠 Solution Design & Implementation

### 📋 Requirements Achievement

This solution addresses all the specified requirements:

#### **Requirement 1: Merge hotel data from different suppliers**
- **Implementation**: Created supplier-specific strategies (`AcmeStrategy`, `PaperfliesStrategy`, `PatagoniaStrategy`) using the Strategy pattern
- **Data Cleaning**: Each strategy handles supplier-specific data formats and applies normalization rules
- **Best Data Selection**: Implements intelligent merging logic prioritizing longer descriptions, more complete address information, and comprehensive amenities

#### **Requirement 2: API endpoint with filtering**
- **Endpoint**: `GET /hotels` accepts `destination_id` and `hotel_ids[]` parameters
- **Unique Results**: Hotels are deduplicated and merged based on hotel IDs
- **Response Format**: Returns data in the exact format specified in requirements

### 🏗️ Architecture Decisions & Thought Process

#### **1. Supplier Integration Architecture**

Two main approaches were considered for handling multiple suppliers with different data formats:

##### **Option 1: Dynamic Database-Driven Configuration** 
```
Database Tables:
├── suppliers (id, name, api_url, active)
├── field_mappings (supplier_id, source_field, target_field, transformation_rule)
├── data_processors (supplier_id, processor_type, config)
└── Generic ETL Service
```

**Approach**: Store supplier configurations and field mappings in database tables, use a generic service to dynamically process any supplier based on configuration.

**Pros:**
- **Runtime Flexibility**: Add new suppliers without code deployment
- **Non-technical Configuration**: Business users can modify mappings via admin interface
- **Uniform Processing**: Single generic ETL service handles all suppliers
- **Dynamic Rules**: Change data merging rules without code changes
- **Audit Trail**: Track configuration changes in database

**Cons:**
- **Complex Debugging**: Harder to debug dynamic mapping issues
- **Performance Overhead**: Runtime interpretation of mappings vs compile-time optimization
- **Type Safety Loss**: Lose TypeScript compile-time validation
- **Testing Complexity**: Harder to unit test dynamic configurations
- **Maintenance Burden**: Complex configuration management and validation needed

##### **Option 2: Strategy Pattern (Chosen Implementation)**
```
providers/suppliers/strategy/
├── acme.strategy.ts
├── paperflies.strategy.ts  
├── patagonia.strategy.ts
├── suppliers.strategy.ts (orchestrator)
└── suppliers.interface.ts (contract)
```

**Approach**: Each supplier has a dedicated strategy class implementing a common interface, with supplier-specific logic hardcoded.

**Pros:**
- **Type Safety**: Full TypeScript compile-time validation
- **Easy Debugging**: Stack traces point to specific strategy code
- **Performance**: No runtime interpretation overhead
- **Testability**: Each strategy independently unit testable
- **IDE Support**: Full autocomplete and refactoring support
- **Code Clarity**: Explicit logic for each supplier's data transformation

**Cons:**
- **Deployment Required**: New suppliers require code deployment
- **Developer Dependency**: Only developers can add new suppliers
- **Code Duplication**: Some common logic might be repeated across strategies

##### **Decision Rationale:**

**Chosen: Strategy Pattern** for the following reasons:

1. **Data Quality Priority**: Hotel data quality is critical; compile-time validation catches more errors than runtime validation
2. **Debugging Complexity**: Supplier data issues are common; explicit code makes debugging significantly easier
3. **Performance Requirements**: Real-time API responses require optimal performance; no runtime interpretation overhead
4. **Developer Preference**: Personal preference for type-safe, explicit implementations over configuration-driven approaches
5. **Supplier Stability**: Hotel suppliers change infrequently, so deployment flexibility less critical
6. **Testing Confidence**: Unit testing explicit logic provides higher confidence than configuration testing

**Trade-off Summary:**
```
Strategy Pattern: Chose developer efficiency + type safety over runtime flexibility
Database Config: Would provide business flexibility at cost of technical complexity
```

#### **2. Data Processing Trigger Strategy**

Two approaches were considered for when and how to trigger the ETL data processing:

##### **Option 1: Direct API-Triggered ETL**
```
Client Request → API → Real-time ETL → Response
```

**Approach**: Trigger ETL processing directly when API requests are made, fetching fresh data from suppliers for each request.

**Pros:**
- **Real-time Data**: Always returns the most current data from suppliers
- **Simpler Architecture**: No background jobs or scheduling complexity
- **No Stale Data**: Eliminates data freshness concerns
- **Resource Efficiency**: Only processes data when actually needed
- **Easier Debugging**: Request-response cycle is synchronous and traceable

**Cons:**
- **High Latency**: API responses slow due to external supplier calls (3+ seconds)
- **Supplier Dependency**: API availability depends on all supplier endpoints being up
- **Rate Limiting**: Risk of hitting supplier API rate limits with multiple concurrent requests
- **Inconsistent Performance**: Response times vary based on supplier response times
- **Error Propagation**: Supplier failures directly impact user-facing API
- **Resource Waste**: Repeated processing of same data for multiple requests

##### **Option 2: Scheduled ETL with Cached Results (Chosen Implementation)**
```
Scheduler → ETL → Database ← API ← Client Request
```

**Approach**: Use cron jobs to periodically fetch and process supplier data, serve API requests from cached database results.

**Pros:**
- **Fast API Response**: Sub-second response times from database cache
- **Resilience**: API remains available even if suppliers are down
- **Consistent Performance**: Predictable response times regardless of supplier status
- **Rate Limit Friendly**: Controlled, scheduled calls to supplier APIs
- **Batch Processing**: Efficient processing of all hotels at once
- **Error Isolation**: Supplier issues don't directly impact user experience

**Cons:**
- **Data Staleness**: Data can be up to 1 hour old (scheduling interval)
- **Complex Architecture**: Requires background job management and monitoring
- **Resource Usage**: Processing runs even when no API requests are made
- **Storage Requirements**: Need to persist processed data in database
- **Debugging Complexity**: Separate processing pipeline from API request flow

##### **Decision Rationale:**

**Chosen: Scheduled ETL** for the following reasons:

1. **User Experience Priority**: API response time critical for user experience; 50ms vs 3000ms response time
2. **Reliability Requirements**: Hotel booking systems need high availability; can't depend on external suppliers
3. **Scalability**: Multiple concurrent users would overwhelm supplier APIs with direct calls
4. **Business Context**: Hotel data doesn't change frequently; hourly updates sufficient for business needs
5. **Error Handling**: Graceful degradation better than complete API failure when suppliers are down
6. **Cost Efficiency**: Fewer API calls to external suppliers reduce potential usage costs

**Implementation Hybrid:**
```typescript
// Scheduled processing (primary)
@Cron(CronExpression.EVERY_HOUR)
async handleHourlyDataProcessing() { ... }

// Manual trigger (backup/testing)
@Post('/scheduler/trigger')
async triggerDataProcessing() { ... }
```

**Trade-off Summary:**
```
Scheduled ETL: Chose user experience + reliability over real-time data freshness
Direct API ETL: Would provide freshest data at cost of performance + reliability
```

##### **Future Considerations:**
- **Hybrid Approach**: Cache-first with optional real-time refresh for premium users
- **Smart Invalidation**: Trigger ETL when supplier data actually changes (webhooks)
- **Tiered Freshness**: Different update frequencies for different data types

#### **3. ETL (Extract, Transform, Load) Pipeline**
Each supplier strategy implements three phases:
- **Extract**: Fetch raw data from supplier API
- **Transform**: Clean, normalize, and merge data with existing records
- **Load**: Persist merged data to database

#### **4. Database-First Approach**
- **PostgreSQL**: Chosen for ACID compliance and complex query support
- **MikroORM**: Provides TypeScript-first ORM with migrations and entity relationships
- **Transactional Operations**: All data operations wrapped in transactions for consistency

#### **5. Scheduled Processing**
- **Cron Jobs**: Automated hourly data processing using `@nestjs/schedule`
- **Manual Triggers**: API endpoint for on-demand data refresh
- **Error Handling**: Comprehensive logging and error recovery

### 🔍 Data Merging Strategy

#### **Hotel Data Merging Rules:**
1. **Names**: Select the longest name (most descriptive)
2. **Descriptions**: Combine and select longest description
3. **Locations**: Merge coordinates and address information, preferring more complete data
4. **Amenities**: Union of all amenities across suppliers, categorized by type
5. **Images**: Merge all unique images by URL, categorized by type (rooms, site, amenities)
6. **Booking Conditions**: Combine all conditions from suppliers

#### **Data Cleaning Applied:**
- **Text Normalization**: Trim whitespace, convert to lowercase for comparisons
- **Deduplication**: Remove duplicate amenities and images based on content
- **Validation**: Ensure required fields are present and valid
- **Sanitization**: Clean HTML/special characters from text fields

### 🚀 Performance Optimizations

#### **1. Data Procurement Performance**
- **Concurrent Processing**: Suppliers fetched in parallel using `Promise.allSettled()`
- **Connection Pooling**: Database connection pool (max 50 connections)
- **Batch Operations**: Bulk database operations where possible
- **Transaction Optimization**: Single transaction per supplier to reduce overhead

#### **2. Data Delivery Performance**
- **Pagination**: Built-in pagination to handle large datasets
- **Selective Loading**: Only load required relations (amenities, destination)
- **Indexing**: Database indexes on commonly queried fields (hotel_id, destination_id)
- **Caching Strategy**: MikroORM result caching enabled

#### **3. Scalability Considerations**
- **Stateless Design**: Application is stateless and horizontally scalable
- **Database Separation**: Read/write splitting potential with repository pattern
- **API Rate Limiting**: Can be added at reverse proxy level
- **Queue System**: Ready for background job processing (Redis/Bull)

### 🎯 Assumptions Made

#### **Data Assumptions:**
1. **Hotel IDs are globally unique** across all suppliers
2. **Destination IDs are consistent** across suppliers
3. **Image URLs are valid and accessible**
4. **API endpoints are reliable** with reasonable uptime
5. **Data volume is manageable** in single-server deployment

#### **Business Assumptions:**
1. **"Best data" means most complete data** (longer descriptions, more amenities)
2. **All supplier data is equally trustworthy**
3. **Historical data preservation** is not required (latest data wins)
4. **Real-time consistency** is not critical (eventual consistency acceptable)

#### **Technical Assumptions:**
1. **Standard HTTP/JSON APIs** from suppliers
2. **PostgreSQL database** is available and properly configured
3. **Server has sufficient memory** for data processing
4. **Network connectivity** to supplier APIs is stable

### ⚖️ Trade-offs & Considerations

#### **Chosen Trade-offs:**

1. **Consistency vs Performance**
   - **Chosen**: Eventual consistency with scheduled updates
   - **Alternative**: Real-time fetching (higher latency, supplier dependency)
   - **Rationale**: Better user experience with cached data

2. **Memory vs Processing**
   - **Chosen**: In-memory processing with database persistence
   - **Alternative**: Stream processing for large datasets
   - **Rationale**: Simpler implementation for moderate data volumes

3. **Complexity vs Flexibility**
   - **Chosen**: Strategy pattern with shared base logic
   - **Alternative**: Generic mapping configuration
   - **Rationale**: Type-safe, maintainable code over configuration

#### **Future Enhancements Considered:**

1. **Caching Layer**: Redis for frequently accessed hotels
2. **Message Queue**: For asynchronous processing of large datasets
3. **Data Versioning**: Track changes in supplier data over time
4. **Health Monitoring**: Supplier availability and data quality metrics
5. **A/B Testing**: Multiple merging strategies comparison
