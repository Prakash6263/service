# Additional Services Architecture Implementation

## Overview

This document describes the new two-tier architecture for Additional Services, following the same pattern as Main Services (BaseService + AdminService).

### Key Changes

- **BaseAdditionalService**: Centralized service definitions (name + image)
- **AdditionalService**: Simplified to reference BaseAdditionalService + dealer-specific details
- **Admin creates BaseAdditionalService first**, then creates AdditionalService instances by selecting a base service and dealer
- **Dealers can only view** their assigned services

---

## 1. New Model: BaseAdditionalService

**File**: `/models/baseAdditionalServiceSchema.js`

```javascript
{
  id: Number,                    // Auto-incremented (0-based)
  name: String (required, unique),
  image: String (required),      // Image path
  timestamps: true
}
```

**Auto Increment Sequence**: `base_additional_service_seq`

---

## 2. Updated Model: AdditionalService

**File**: `/models/additionalServiceSchema.js`

### Removed Fields:
- `name`
- `image`

### Updated Fields:
```javascript
{
  id: Number,                    // Auto-incremented
  serviceId: String (unique),    // Format: MKBDASVC-###
  base_additional_service_id: ObjectId → BaseAdditionalService (required),
  description: String (optional),
  bikes: [
    {
      cc: Number (required, > 0),
      price: Number (required, >= 0)
    }
  ],
  dealer_id: ObjectId → Vendor (required),
  timestamps: true
}
```

**Key Validation**:
- `cc > 0` (must be positive)
- `bikes array not empty` (at least one CC/price pair required)
- `base_additional_service_id` must exist
- `dealer_id` must be valid Vendor

---

## 3. API Endpoints

### A. BaseAdditionalService (Admin Only)

#### Create
```
POST /base-additional-service
Content-Type: multipart/form-data
Authorization: Token required

Body:
- name (string, required, unique)
- image (file, required)

Response:
{
  status: true,
  message: "Base additional service created successfully",
  data: { id, name, image, ... }
}
```

#### List All
```
GET /base-additional-service
Authorization: Token required

Response:
{
  status: true,
  message: "Base additional services fetched successfully",
  data: [...]
}
```

#### Get By ID
```
GET /base-additional-service/:id
Authorization: Token required

Response:
{
  status: true,
  message: "Base additional service fetched successfully",
  data: { ... }
}
```

#### Update
```
PUT /base-additional-service/:id
Content-Type: multipart/form-data
Authorization: Token required

Body:
- name (string, optional)
- image (file, optional)

Response:
{
  status: true,
  message: "Base additional service updated successfully",
  data: { ... }
}
```

#### Delete
```
DELETE /base-additional-service/:id
Authorization: Token required

Delete Rule: Prevent deletion if referenced by any AdditionalService

Response:
{
  status: true,
  message: "Base additional service deleted successfully"
}
```

---

### B. AdditionalService (Admin Creates, Dealer Views)

#### Create (Admin Only)
```
POST /admin/additional-services
Content-Type: application/json
Authorization: Token required

Body:
{
  base_additional_service_id: ObjectId (required),
  dealer_id: ObjectId (required),
  description: String (optional),
  bikes: [
    { cc: Number (>0), price: Number (>=0) },
    ...
  ]
}

Response:
{
  status: 200,
  message: "Additional service added successfully",
  data: {
    id, serviceId, 
    base_additional_service_id: { id, name, image },
    dealer_id: { shopName },
    description,
    bikes,
    ...
  }
}
```

#### Get All (Admin Only)
```
GET /admin/additional-services
Authorization: Token required

Response:
{
  status: 200,
  message: "Success",
  data: [
    {
      id, serviceId,
      base_additional_service_id: { id, name, image },
      dealer_id: { shopName, email },
      description,
      bikes,
      ...
    },
    ...
  ]
}
```

#### Get Single (Admin Only)
```
GET /admin/additional-services/:id
Authorization: Token required

Response:
{
  status: 200,
  message: "Success",
  data: { ... }
}
```

#### Update (Admin Only)
```
PUT /admin/additional-services/:id
Content-Type: application/json
Authorization: Token required

Body (all optional):
{
  base_additional_service_id: ObjectId,
  dealer_id: ObjectId,
  description: String,
  bikes: [...]
}

Validation: Same as Create

Response:
{
  status: 200,
  message: "Additional service updated successfully",
  data: { ... }
}
```

#### Delete (Admin Only)
```
DELETE /admin/additional-services/:id
Authorization: Token required

Response:
{
  status: 200,
  message: "Additional service deleted successfully"
}
```

#### Get Dealer's Services (Dealer Only)
```
GET /dealer/additional-services/:dealerId
Query Params: ?cc=500 (optional - filter by CC)

Response:
{
  status: 200,
  message: "Success",
  data: [
    {
      id, serviceId,
      base_additional_service_id: { name, image },
      bikes: [ filtered if cc provided ],
      ...
    },
    ...
  ]
}
```

---

## 4. Database Relationships

```
BaseAdditionalService (1) ----< (Many) AdditionalService
  - Used by multiple dealers
  - Centralized name/image

AdditionalService (Many) ----> (1) Vendor (Dealer)
  - Each service assigned to ONE dealer
  - Dealer can have multiple services

AdditionalService (Many) ----> (1) BaseAdditionalService
  - References the base service details
```

---

## 5. File Structure

```
models/
  ├── baseAdditionalServiceSchema.js    (NEW)
  └── additionalServiceSchema.js        (UPDATED)

controller/
  ├── baseAdditionalServiceController.js (NEW)
  └── additionalServiceController.js     (UPDATED)

routes/
  ├── baseAdditionalServiceRoutes.js     (NEW)
  ├── additionalRouter.js                (UPDATED)
  └── index.js                           (UPDATED)

uploads/
  ├── base-additional-services/          (NEW)
  └── additional-services/               (existing)
```

---

## 6. Implementation Checklist

- [x] Create BaseAdditionalService model
- [x] Update AdditionalService model (remove name/image, add base_additional_service_id)
- [x] Create BaseAdditionalService controller with CRUD
- [x] Update AdditionalService controller (new validation, populate base service)
- [x] Create base-additional-service routes
- [x] Update additional-service routes (new endpoints: /admin/*, /dealer/*)
- [x] Register routes in /routes/index.js
- [x] Add referential integrity (prevent deleting base service if referenced)
- [x] Add bike validation (cc > 0, non-empty bikes array)
- [x] Add proper population of related documents

---

## 7. Migration Notes

### For Existing AdditionalServices:

You need to migrate existing AdditionalServices to use the new schema:

1. Create BaseAdditionalService entries from existing service names/images
2. Update AdditionalService documents to reference the new base services
3. Remove name and image fields from AdditionalService

Example migration script:
```javascript
// 1. Create base services from existing services
const services = await AdditionalService.find();
for (const service of services) {
  const baseService = await BaseAdditionalService.create({
    name: service.name,
    image: service.image
  });
  
  // 2. Update service to reference base service
  await AdditionalService.findByIdAndUpdate(
    service._id,
    { 
      base_additional_service_id: baseService._id,
      $unset: { name: 1, image: 1 }
    }
  );
}
```

---

## 8. Security & Validation

✓ Only Admin can CREATE/UPDATE/DELETE AdditionalService  
✓ Only Admin can CREATE/UPDATE/DELETE BaseAdditionalService  
✓ Dealers can only READ their assigned services  
✓ Token verification required on all endpoints  
✓ Validate bikes array: cc > 0, price >= 0  
✓ Prevent deletion of BaseAdditionalService if referenced  
✓ Validate ObjectId formats  
✓ Populate foreign key fields (name, image, shopName)  

---

## 9. Usage Flow

### Admin Flow:
1. Admin creates BaseAdditionalService (name + image)
2. Admin lists BaseAdditionalServices to see available options
3. Admin creates AdditionalService by:
   - Selecting a BaseAdditionalService
   - Selecting a Dealer
   - Adding description (optional)
   - Adding CC/price mappings
4. Admin can update/delete AdditionalService

### Dealer Flow:
1. Dealer views their assigned AdditionalServices
2. Can filter by CC if needed
3. See service details (name, image, price for their CC)
4. Cannot create/edit/delete services

---

## 10. Error Responses

All endpoints follow this error response format:

```javascript
{
  status: false,
  message: "Error description",
  field: "field_name" (optional - for validation errors)
}
```

Common status codes:
- 400: Bad Request (validation error)
- 401: Unauthorized (missing/invalid token)
- 404: Not Found
- 500: Internal Server Error
