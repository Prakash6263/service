# Additional Services API - Complete Documentation

## Overview
The Additional Services API follows a **Base Service Pattern** that mirrors the Admin Service structure, allowing dealers to create and manage additional services for their customers.

---

## Database Model

### Schema: `additionalServiceSchema.js`

```javascript
{
  id: Number                          // Auto-incremented ID
  serviceId: String                   // Unique ID (format: MKBDASVC-###)
  name: String (required)             // Service name
  image: String                       // Image path (format: uploads/additional-services/...)
  description: String                 // Service description
  bikes: [{                           // Array of bike pricing
    cc: Number (required)             // Bike engine capacity
    price: Number (required)          // Service price
  }]
  dealer_id: ObjectId (required)      // Reference to Vendor/Dealer
  timestamps: true                    // createdAt, updatedAt
}
```

**Auto-generated Fields:**
- `id`: Automatically incremented using mongoose-sequence plugin
- `serviceId`: Generated in format `MKBDASVC-###` (e.g., MKBDASVC-001)

---

## API Endpoints

### Base URL
```
/api/additional-service
```

All endpoints require authentication token in header: `token: <JWT_TOKEN>`

---

## 1. CREATE ADDITIONAL SERVICE

**Endpoint:** `POST /`

**URL:** `/api/additional-service`

**Authentication:** Required (JWT token in header)

**Request Type:** `multipart/form-data`

**Request Body:**
```
name (text, required)          - Service name
dealer_id (text, required)     - Dealer MongoDB ObjectId
image (file, required)         - Service image file
description (text, optional)   - Service description
bikes (text, optional)         - JSON array: [{"cc": 100, "price": 1500}]
```

**Example cURL:**
```bash
curl -X POST http://localhost:5000/api/additional-service \
  -H "token: your_jwt_token" \
  -F "name=Periodic Service" \
  -F "dealer_id=6731f8a9c5e8d6a4b3c9e1f2" \
  -F "image=@/path/to/image.jpg" \
  -F "description=Complete periodic service" \
  -F 'bikes=[{"cc": 100, "price": 1500}, {"cc": 150, "price": 2000}]'
```

**Success Response (201):**
```json
{
  "status": true,
  "message": "Additional service created successfully",
  "data": {
    "_id": "6731f8a9c5e8d6a4b3c9e1f3",
    "id": 1,
    "serviceId": "MKBDASVC-001",
    "name": "Periodic Service",
    "image": "uploads/additional-services/image-1234567890.jpg",
    "description": "Complete periodic service",
    "bikes": [
      { "cc": 100, "price": 1500 },
      { "cc": 150, "price": 2000 }
    ],
    "dealer_id": "6731f8a9c5e8d6a4b3c9e1f2",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- 401: `"Token required"` - Missing JWT token
- 400: `"Service name is required"` - Missing service name
- 400: `"Valid dealer ID is required"` - Invalid dealer_id
- 400: `"Service image is required"` - Missing image file

---

## 2. READ ALL ADDITIONAL SERVICES

**Endpoint:** `GET /`

**URL:** `/api/additional-service`

**Authentication:** Required

**Query Parameters:** None

**Success Response (200):**
```json
{
  "status": true,
  "message": "Additional services fetched successfully",
  "data": [
    {
      "_id": "6731f8a9c5e8d6a4b3c9e1f3",
      "id": 1,
      "serviceId": "MKBDASVC-001",
      "name": "Periodic Service",
      "image": "uploads/additional-services/image-1234567890.jpg",
      "description": "Complete periodic service",
      "bikes": [...],
      "dealer_id": { "_id": "...", "shopName": "..." },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 3. READ SINGLE ADDITIONAL SERVICE

**Endpoint:** `GET /:id`

**URL:** `/api/additional-service/{service_id}`

**Authentication:** Required

**Path Parameters:**
- `id` (required): Service MongoDB ObjectId

**Success Response (200):**
```json
{
  "status": true,
  "message": "Additional service fetched successfully",
  "data": {
    "_id": "6731f8a9c5e8d6a4b3c9e1f3",
    "id": 1,
    "serviceId": "MKBDASVC-001",
    "name": "Periodic Service",
    "image": "uploads/additional-services/image-1234567890.jpg",
    "description": "Complete periodic service",
    "bikes": [
      { "cc": 100, "price": 1500 },
      { "cc": 150, "price": 2000 }
    ],
    "dealer_id": { "_id": "...", "shopName": "..." },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "status": false,
  "message": "Additional service not found"
}
```

---

## 4. READ SERVICES BY DEALER ID

**Endpoint:** `GET /dealer/:dealerId`

**URL:** `/api/additional-service/dealer/{dealer_id}`

**Authentication:** Required

**Path Parameters:**
- `dealerId` (required): Dealer MongoDB ObjectId

**Query Parameters (optional):**
- `cc`: Bike CC for filtering (e.g., `?cc=100`)

**Example with CC Filter:**
```
GET /api/additional-service/dealer/6731f8a9c5e8d6a4b3c9e1f2?cc=100
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Additional services fetched successfully",
  "data": [
    {
      "_id": "6731f8a9c5e8d6a4b3c9e1f3",
      "id": 1,
      "serviceId": "MKBDASVC-001",
      "name": "Periodic Service",
      "image": "uploads/additional-services/image-1234567890.jpg",
      "bikes": [
        { "cc": 100, "price": 1500 }
      ],
      "dealer_id": { "_id": "6731f8a9c5e8d6a4b3c9e1f2", "shopName": "..." },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## 5. UPDATE ADDITIONAL SERVICE

**Endpoint:** `PUT /:id`

**URL:** `/api/additional-service/{service_id}`

**Authentication:** Required

**Request Type:** `multipart/form-data`

**Request Body (all optional):**
```
name (text, optional)          - Updated service name
description (text, optional)   - Updated description
image (file, optional)         - New service image
bikes (text, optional)         - Updated bikes: [{"cc": 100, "price": 1800}]
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Additional service updated successfully",
  "data": {
    "_id": "6731f8a9c5e8d6a4b3c9e1f3",
    "id": 1,
    "serviceId": "MKBDASVC-001",
    "name": "Updated Service Name",
    "image": "uploads/additional-services/image-new-timestamp.jpg",
    "description": "Updated description",
    "bikes": [
      { "cc": 100, "price": 1800 },
      { "cc": 150, "price": 2200 }
    ],
    "dealer_id": "6731f8a9c5e8d6a4b3c9e1f2",
    "updatedAt": "2024-01-15T11:45:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "status": false,
  "message": "Service name cannot be empty",
  "field": "name"
}
```

---

## 6. DELETE ADDITIONAL SERVICE

**Endpoint:** `DELETE /:id`

**URL:** `/api/additional-service/{service_id}`

**Authentication:** Required

**Path Parameters:**
- `id` (required): Service MongoDB ObjectId

**Success Response (200):**
```json
{
  "status": true,
  "message": "Additional service deleted successfully"
}
```

**Error Response (404):**
```json
{
  "status": false,
  "message": "Additional service not found"
}
```

---

## 7. SAVE SELECTED SERVICES

**Endpoint:** `POST /select-services/save`

**URL:** `/api/additional-service/select-services/save`

**Authentication:** Required

**Request Type:** `application/json`

**Request Body:**
```json
{
  "dealer_id": "6731f8a9c5e8d6a4b3c9e1f2",
  "selected_services": [
    "6731f8a9c5e8d6a4b3c9e1f3",
    "6731f8a9c5e8d6a4b3c9e1f4"
  ]
}
```

**Success Response (200):**
```json
{
  "status": true,
  "message": "Services selected successfully",
  "data": {
    "selectedServices": [
      {
        "_id": "6731f8a9c5e8d6a4b3c9e1f3",
        "name": "Periodic Service",
        "serviceId": "MKBDASVC-001"
      },
      {
        "_id": "6731f8a9c5e8d6a4b3c9e1f4",
        "name": "Oil Change Service",
        "serviceId": "MKBDASVC-002"
      }
    ]
  }
}
```

**Error Response (400):**
```json
{
  "status": false,
  "message": "Please select at least one service",
  "field": "selected_services"
}
```

---

## Backward Compatibility (Deprecated Routes)

The following old routes are maintained for backward compatibility but should NOT be used in new implementations:

| Method | Old Route | New Route |
|--------|-----------|-----------|
| POST | `/add-service` | `/` |
| GET | `/all-additional-services` | `/` |
| GET | `/single-additional-service/:id` | `/:id` |
| PUT | `/updated-additional-service/:id` | `/:id` |
| DELETE | `/delete-additional-service/:id` | `/:id` |

---

## Response Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Validation error or invalid request |
| 401 | Unauthorized | Token missing or invalid |
| 404 | Not Found | Resource not found |
| 500 | Server Error | Internal server error |

---

## Response Structure

### Success Response
```json
{
  "status": true,
  "message": "Description of what happened",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "status": false,
  "message": "Error description",
  "field": "optional_field_name", // Only when applicable
  "error": "error.message"
}
```

---

## Authentication

All endpoints require JWT token in the header:

```
Headers:
{
  "token": "your_jwt_token_here"
}
```

The token is validated and decoded to extract:
- `user_id` or `id`: Used for authorization checks

---

## Image Upload

- **Folder:** `uploads/additional-services/`
- **Format:** Image files (jpg, png, etc.)
- **Max Size:** Depends on multer configuration
- **Naming:** `image-{timestamp}.{extension}`

---

## Notes for Frontend Integration

1. **Authentication:** Always include the JWT token in the `token` header
2. **Image Uploads:** Use `multipart/form-data` for endpoints with image uploads
3. **Bikes Data:** Send as JSON string: `'[{"cc": 100, "price": 1500}]'`
4. **Error Handling:** Check `status` field (true/false) to determine success/failure
5. **Field Validation:** Use the `field` property in error responses to highlight UI fields
6. **Base URL:** Update base URL based on environment (dev/prod)

---

## Example Frontend Workflow (Vue/React)

```javascript
// 1. Create new service
const createService = async (formData) => {
  const response = await fetch('/api/additional-service', {
    method: 'POST',
    headers: {
      'token': dealerToken
    },
    body: formData // FormData with image and bikes
  });
  return response.json();
};

// 2. Fetch dealer's services
const fetchDealerServices = async (dealerId) => {
  const response = await fetch(
    `/api/additional-service/dealer/${dealerId}`,
    {
      method: 'GET',
      headers: {
        'token': dealerToken
      }
    }
  );
  return response.json();
};

// 3. Update service
const updateService = async (serviceId, formData) => {
  const response = await fetch(
    `/api/additional-service/${serviceId}`,
    {
      method: 'PUT',
      headers: {
        'token': dealerToken
      },
      body: formData
    }
  );
  return response.json();
};

// 4. Delete service
const deleteService = async (serviceId) => {
  const response = await fetch(
    `/api/additional-service/${serviceId}`,
    {
      method: 'DELETE',
      headers: {
        'token': dealerToken
      }
    }
  );
  return response.json();
};
```

---

## Troubleshooting

### Common Issues

1. **"Token required" error**
   - Solution: Ensure JWT token is included in request header

2. **"Valid dealer ID is required" error**
   - Solution: Verify dealer_id is a valid MongoDB ObjectId format

3. **Image upload fails**
   - Solution: Ensure form field is named "image" and file is actually sent

4. **"Invalid bikes data format" error**
   - Solution: Send bikes as valid JSON string, e.g., `'[{"cc": 100, "price": 1500}]'`

---

## Testing with Postman

1. Import the provided `POSTMAN_COLLECTION_ADDITIONAL_SERVICES.json`
2. Set environment variables:
   - `base_url`: http://localhost:5000/api
   - `dealer_token`: Your JWT token
   - `dealer_id`: Your dealer ObjectId
   - `service_id`: An existing service ObjectId
3. Execute requests in order for full workflow testing

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**Status:** Complete - Base Service Pattern Implemented
