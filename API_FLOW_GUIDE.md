# Additional Services API - Complete Flow Guide

## Overview

The Additional Services system has two main components:
1. **Base Additional Services** - Master records managed by admins (name, image, description)
2. **Additional Services** - Dealer-specific instances with bike CC and pricing

## Architecture

```
┌─────────────────────────────────────────────────────┐
│         Base Additional Services                     │
│  (Admin manages: name, image, description)          │
│  Example: "Free Maintenance Package"                │
└────────────────┬────────────────────────────────────┘
                 │
                 │ Referenced by
                 ↓
┌─────────────────────────────────────────────────────┐
│      Additional Services (Per Dealer)               │
│  (Contains: bikes CC/price, dealer_id, description) │
│  Dealer A: 100cc→5000, 125cc→6000                  │
│  Dealer B: 100cc→4500, 125cc→5500                  │
└─────────────────────────────────────────────────────┘
```

## API Flow - Complete Workflow

### Phase 1: Admin Setup (Base Services)

#### 1.1 Create Base Additional Service
```
POST /base-additional-service/
Authorization: Bearer {{admin_token}}

Request Body:
{
  "name": "Free Maintenance Package",
  "image": "uploads/base-additional-services/maintenance.jpg",
  "description": "Complimentary service for first year"
}

Response (201):
{
  "status": 200,
  "message": "Base additional service created successfully",
  "data": {
    "_id": "66a1b2c3d4e5f6g7h8i9j0k1",
    "id": 1,
    "name": "Free Maintenance Package",
    "image": "uploads/base-additional-services/maintenance.jpg",
    "description": "Complimentary service for first year",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### 1.2 Get All Base Services
```
GET /base-additional-service/
Authorization: Bearer {{admin_token}}

Response (200):
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "_id": "66a1b2c3d4e5f6g7h8i9j0k1",
      "id": 1,
      "name": "Free Maintenance Package",
      "image": "uploads/base-additional-services/maintenance.jpg",
      ...
    }
  ]
}
```

#### 1.3 View/Update Base Service
```
GET /base-additional-service/{{base_service_id}}
PUT /base-additional-service/{{base_service_id}}

PUT Request Body:
{
  "name": "Premium Maintenance Package",
  "description": "Complimentary service for 2 years"
}
```

---

### Phase 2: Admin Assignment (Link Services to Dealers)

#### 2.1 Create Additional Service for Dealer
```
POST /additional-service/admin/additional-services
Authorization: Bearer {{admin_token}}

Request Body:
{
  "base_additional_service_id": "66a1b2c3d4e5f6g7h8i9j0k1",
  "dealer_id": "56d1b2c3d4e5f6g7h8i9j0a2",
  "description": "Free maintenance for Hero bikes at XYZ Dealer",
  "bikes": [
    {
      "cc": 100,
      "price": 5000
    },
    {
      "cc": 125,
      "price": 6000
    },
    {
      "cc": 150,
      "price": 7000
    }
  ]
}

Response (201):
{
  "status": 200,
  "message": "Additional service added successfully",
  "data": {
    "_id": "76b2c3d4e5f6g7h8i9j0k1l2",
    "id": 101,
    "serviceId": "MKBDASVC-001",
    "base_additional_service_id": {
      "_id": "66a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Free Maintenance Package",
      "image": "uploads/base-additional-services/maintenance.jpg"
    },
    "dealer_id": {
      "_id": "56d1b2c3d4e5f6g7h8i9j0a2",
      "shopName": "XYZ Hero Dealer"
    },
    "description": "Free maintenance for Hero bikes at XYZ Dealer",
    "bikes": [
      {
        "cc": 100,
        "price": 5000
      },
      {
        "cc": 125,
        "price": 6000
      },
      {
        "cc": 150,
        "price": 7000
      }
    ],
    "createdAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
}
```

#### 2.2 View All Dealer Services (Admin)
```
GET /additional-service/admin/additional-services
Authorization: Bearer {{admin_token}}

Response: Lists all services across all dealers with populated base service info
```

#### 2.3 Update Service Pricing for Dealer
```
PUT /additional-service/admin/additional-services/{{service_id}}
Authorization: Bearer {{admin_token}}

Request Body:
{
  "bikes": [
    {
      "cc": 100,
      "price": 5500
    },
    {
      "cc": 125,
      "price": 6500
    },
    {
      "cc": 150,
      "price": 7500
    }
  ]
}
```

---

### Phase 3: Dealer View & Customer Purchase

#### 3.1 Dealer Gets Their Services
```
GET /additional-service/dealer/additional-services/{{dealer_id}}
Authorization: Bearer {{dealer_token}}

Response (200):
{
  "status": 200,
  "message": "Success",
  "data": [
    {
      "_id": "76b2c3d4e5f6g7h8i9j0k1l2",
      "serviceId": "MKBDASVC-001",
      "base_additional_service_id": {
        "_id": "66a1b2c3d4e5f6g7h8i9j0k1",
        "name": "Free Maintenance Package",
        "image": "uploads/base-additional-services/maintenance.jpg"
      },
      "description": "Free maintenance for Hero bikes at XYZ Dealer",
      "bikes": [
        {
          "cc": 100,
          "price": 5000
        },
        {
          "cc": 125,
          "price": 6000
        },
        {
          "cc": 150,
          "price": 7000
        }
      ]
    }
  ]
}
```

#### 3.2 Dealer Gets Services for Specific Bike CC
```
GET /additional-service/dealer/additional-services/{{dealer_id}}?cc=100
Authorization: Bearer {{dealer_token}}

Response: Same structure but bikes array filtered to only cc=100
```

---

## Request/Response Examples

### Admin Token Setup
Before making admin requests, obtain JWT token:
```
POST /adminauth/login
{
  "email": "admin@mrsbike.com",
  "password": "admin_password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Handling

#### Invalid Base Service ID
```
POST /additional-service/admin/additional-services
{
  "base_additional_service_id": "invalid_id",
  ...
}

Response (400):
{
  "status": 400,
  "message": "Invalid base additional service ID format"
}
```

#### Base Service Not Found
```
Response (404):
{
  "status": 404,
  "message": "Base additional service not found"
}
```

#### Empty Bikes Array
```
POST /additional-service/admin/additional-services
{
  "base_additional_service_id": "66a1b2c3d4e5f6g7h8i9j0k1",
  "dealer_id": "56d1b2c3d4e5f6g7h8i9j0a2",
  "bikes": []
}

Response (400):
{
  "status": 400,
  "message": "At least one bike with CC and price is required"
}
```

#### Invalid Bike CC
```
Response (400):
{
  "status": 400,
  "message": "Each bike must have CC > 0"
}
```

---

## Validation Rules

### Bikes Array
- Must contain at least 1 bike
- Each bike must have:
  - `cc`: Number > 0 (required)
  - `price`: Number >= 0 (required)

### Service References
- `base_additional_service_id`: Must reference existing BaseAdditionalService
- `dealer_id`: Must reference existing Dealer

### Deletion Rules
- Can delete BaseAdditionalService only if no AdditionalService references it
- Additional Services can be deleted anytime

---

## Postman Collection Usage

1. **Import Collection**: Import `postman_collection_additional_services.json` into Postman
2. **Set Environment Variables**:
   - `base_url`: Your API base URL (e.g., http://localhost:5000/api)
   - `admin_token`: Your JWT admin token
   - `dealer_token`: Your JWT dealer token
   - `base_service_id`: Copy from Create response
   - `dealer_id`: Your dealer ID
   - `service_id`: Copy from Create response

3. **Execute Flow**:
   - Start with "1. Create Base Additional Service"
   - Save returned `_id` to `base_service_id` variable
   - Then "1. Create Additional Service (Admin)"
   - Save returned `_id` to `service_id` variable
   - Test other endpoints

---

## Database Schema Reference

### BaseAdditionalService
```javascript
{
  id: Number (auto-incremented),
  name: String (required),
  image: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

### AdditionalService
```javascript
{
  id: Number (auto-incremented),
  serviceId: String (format: MKBDASVC-###),
  base_additional_service_id: ObjectId (ref: BaseAdditionalService),
  dealer_id: ObjectId (ref: Vendor),
  description: String,
  bikes: [
    {
      cc: Number,
      price: Number
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## Common Issues & Solutions

### Issue: "Cannot find module additionalOptionsSchema"
**Solution**: Remove unnecessary imports. Only import:
- AdditionalService
- BaseAdditionalService
- mongoose

### Issue: Service deletion fails with referential integrity error
**Solution**: This is expected. Delete all AdditionalServices using that BaseAdditionalService first, then delete the BaseAdditionalService.

### Issue: Bikes array validation fails
**Solution**: Ensure all bikes have cc > 0 and price >= 0. Example:
```json
"bikes": [
  {
    "cc": 100,
    "price": 5000
  }
]
```

---

## Testing Checklist

- [ ] Admin can create base services
- [ ] Admin can create additional services with valid bikes array
- [ ] Admin can update pricing for existing services
- [ ] Admin can view all services across dealers
- [ ] Dealer can view only their assigned services
- [ ] Dealer can filter services by bike CC
- [ ] Bikes array validation works (non-empty, cc > 0)
- [ ] Referential integrity prevents orphaned services
- [ ] JWT authentication required for all endpoints
