# RestaurantAI — REST API Specification (v2)

This document details the backend REST API contract for the Restaurant Purchase & Supply Management system.

---

## 📝 Changelog from v1

| # | Change | Why |
|---|--------|-----|
| 1 | All responses (success + error) now use one envelope: `{ success, data }` or `{ success, error }` | v1 mixed raw arrays/objects with an ad-hoc `{success:true}` wrapper only on auth routes. One shape means one response type on the frontend, always. |
| 2 | Consolidated to a single plain `name` field *(reverted/updated)* | Kept as a single `name` field containing a single plain text string (e.g. `"Pork Belly"`), matching the requested database convention — there is no slash or bilingual formatting in the name field. |
| 3 | All list endpoints now paginated (`page`, `limit`, `meta.total`) | v1 returned bare arrays with no pagination despite claiming payloads could be "paginated." Orders/transactions grow indefinitely — this breaks at scale without it. |
| 4 | Checkin (3.4) changed `PUT` → `PATCH` | Checkin only patches specific item fields (received qty, actual price, packing status) — it doesn't replace the full order resource. `PUT` implies full replacement. |
| 5 | Budgets (5.2) and Exchange Rates (6.1) changed to `PUT /budgets/:category_id/:month` and `PUT /exchange-rates/:rate_date` | Both operations upsert against a natural unique key (category+month, or date+restaurant). `PUT` is only correct when the resource identity is *in the URL* — v1 had the identity fields buried in the body, which isn't idempotent-safe the way `PUT` promises. |
| 6 | Added `Idempotency-Key` header requirement on all money-moving POSTs (orders, transactions) | Staff use this on mobile at the market with unreliable signal. Without an idempotency key, a retried request on timeout can create a duplicate order or duplicate transaction. |
| 7 | Added Suppliers, Categories, Finance Categories, and Users API sections | These tables exist in the schema and are referenced by other resources (`orders.supplier_id`, `ingredients.category_id`, `transactions.category_id`) but had zero endpoints in v1 — the frontend would have no way to populate these dropdowns. |
| 8 | Added `PATCH .../:id/deactivate` pattern for ingredients/suppliers/users | Schema uses `is_active` soft-flags, not hard deletes — there was no endpoint to actually set it. |
| 9 | Fixed the global error example to use a field (`ordered`) that a real request body actually contains | v1's example used `total_usd`, which is server-computed and never client-submitted — the example didn't match any real request in the doc. |
| 10 | Documented `fx_rate_used` auto-population behavior explicitly | v1 showed it appearing in responses with no explanation of where it comes from. |
| 11 | Added token expiry + `/auth/refresh` | v1 issued a JWT with no expiry or renewal path documented. |
| 12 | Standardized all query params and body fields to `snake_case` | v1 mixed `requestType`/`startDate` (camelCase) with `category_id`/`total_usd` (snake_case) in the same document. |
| 13 | Added a standard HTTP status code reference table | v1 only ever showed 200/201, with no documented behavior for 400/401/403/404/409/422. |
| 14 | Documented that `restaurant_id` is always derived server-side from the JWT and must never be accepted from the client | Implicit in v1 (no request body ever included it) but never stated — worth making explicit so it's never "fixed" into a request body by mistake later. |

---

## Global API Conventions

### Base URL
```
https://api.restaurantai.com/v1
```

### Common HTTP Headers
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
Accept-Language: en          # 'en' or 'kh' — localizes error messages only, not data fields
Idempotency-Key: <uuid_v4>   # Required on all POST requests that create financial or order records
```

### Tenant Scoping
`restaurant_id` is **never** accepted in any request body or query param. It is derived exclusively from the authenticated user's JWT claims on the server. This prevents a compromised or buggy client from writing data into another tenant's restaurant.

### Global Success Response Envelope
```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 143,
    "total_pages": 8
  }
}
```
`meta` is present only on paginated list endpoints. Single-resource responses omit it.

### Global Error Response Envelope (`4xx` / `5xx`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request payload failed validation checks.",
    "details": [
      {
        "field": "items[0].ordered",
        "issue": "ordered must be a positive decimal."
      }
    ]
  }
}
```

### Standard HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| `200` | OK | Successful GET/PATCH/PUT |
| `201` | Created | Successful POST that creates a resource |
| `204` | No Content | Successful DELETE / deactivate with no body |
| `400` | Bad Request | Malformed JSON, missing required field |
| `401` | Unauthorized | Missing/expired/invalid JWT |
| `403` | Forbidden | Valid JWT, but role lacks permission (e.g. `staff` trying to approve an order) |
| `404` | Not Found | Resource doesn't exist, or belongs to a different `restaurant_id` |
| `409` | Conflict | Duplicate natural key (e.g. exchange rate already set for that date, order already has a linked transaction) |
| `422` | Unprocessable Entity | Well-formed request, fails business validation (`VALIDATION_FAILED`) |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unhandled server fault |

### Pagination Query Params (all list endpoints)
* `page` (Optional, default `1`)
* `limit` (Optional, default `20`, max `100`)

---

## Table of Contents

1. [Authentication API](#1-authentication-api)
2. [Ingredients Catalog API](#2-ingredients-catalog-api)
3. [Categories API](#3-categories-api)
4. [Suppliers API](#4-suppliers-api)
5. [Orders (Requisitions) API](#5-orders-requisitions-api)
6. [Transactions (Finance) API](#6-transactions-finance-api)
7. [Finance Categories API](#7-finance-categories-api)
8. [Budget Limits API](#8-budget-limits-api)
9. [Exchange Rates API](#9-exchange-rates-api)
10. [Users API](#10-users-api)

---

## 1. Authentication API

### 1.1 User Login
* **HTTP Method**: `POST`
* **Endpoint**: `/auth/login`
* **Auth Required**: No

**Request Body**
```json
{
  "username": "dara_manager",
  "password": "SecurePassword123"
}
```

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh_token": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "name": "Manager Dara",
      "username": "dara_manager",
      "role": "manager",
      "restaurant_id": 12
    }
  }
}
```

---

### 1.2 Refresh Token
* **HTTP Method**: `POST`
* **Endpoint**: `/auth/refresh`
* **Auth Required**: No (requires valid `refresh_token`)

**Request Body**
```json
{
  "refresh_token": "d290f1ee-6c54-4b01-90e6-d701748f0851"
}
```

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "refresh_token": "b3e1a02c-9f45-4a1e-8f3d-2c9e1a02c9f4",
    "expires_in": 3600
  }
}
```

---

### 1.3 User Registration
* **HTTP Method**: `POST`
* **Endpoint**: `/auth/register`
* **Auth Required**: Yes (Manager / Admin only — staff cannot self-register into a restaurant)

**Request Body**
```json
{
  "name": "Chef John",
  "username": "john_chef",
  "password": "SecurePassword123",
  "role": "chef"
}
```

**Response Body (`201 Created`)**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Chef John",
    "username": "john_chef",
    "role": "chef",
    "restaurant_id": 12
  }
}
```

> **Note**: changed from "Auth Required: No" in v1. Open self-registration lets anyone create an account under any `restaurant_id` context they can guess — registration should require an authenticated manager/admin creating accounts for their own tenant.

---

## 2. Ingredients Catalog API

### 2.1 List Ingredients
* **HTTP Method**: `GET`
* **Endpoint**: `/ingredients`
* **Auth Required**: Yes

**Query Parameters**
* `request_type` (Optional): `glossary` | `stuff`
* `category_id` (Optional): Category numeric ID
* `is_active` (Optional, default `true`)
* `page`, `limit` (Optional, see pagination conventions)

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "name": "Pork Belly",
      "category_id": 1,
      "current_stock": 5.00,
      "par_stock": 15.00,
      "default_unit": "kg",
      "allowed_units": ["kg", "gram"],
      "default_price": 7.50,
      "low_stock_threshold": 3.00,
      "request_type": "glossary",
      "is_custom": false,
      "is_active": true
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 87, "total_pages": 5 }
}
```

---

### 2.2 Create Custom Ingredient
* **HTTP Method**: `POST`
* **Endpoint**: `/ingredients`
* **Auth Required**: Yes (Kitchen Staff / Manager)

**Request Body**
```json
{
  "name": "White Truffle Oil",
  "category_id": 4,
  "default_unit": "bottle",
  "allowed_units": ["bottle", "pack"],
  "default_price": 45.00,
  "request_type": "glossary"
}
```

**Response Body (`201 Created`)**
```json
{
  "success": true,
  "data": {
    "id": 501,
    "name": "White Truffle Oil",
    "category_id": 4,
    "current_stock": 0.00,
    "par_stock": 0.00,
    "default_unit": "bottle",
    "allowed_units": ["bottle", "pack"],
    "default_price": 45.00,
    "low_stock_threshold": null,
    "request_type": "glossary",
    "is_custom": true,
    "is_active": true
  }
}
```

---

### 2.3 Deactivate Ingredient
* **HTTP Method**: `PATCH`
* **Endpoint**: `/ingredients/:id/deactivate`
* **Auth Required**: Yes (Manager / Admin)

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": { "id": 501, "is_active": false }
}
```

> No `DELETE` endpoint is offered — ingredients referenced by historical `order_items` must never be hard-deleted, or past orders lose their line-item identity.

---

## 3. Categories API

### 3.1 List Categories
* **HTTP Method**: `GET`
* **Endpoint**: `/categories`
* **Auth Required**: Yes

**Query Parameters**
* `type` (Optional): `glossary` | `stuff`

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Meat & Poultry",
      "type": "glossary",
      "sort_order": 1
    }
  ]
}
```

> Not paginated — category lists are small, fixed-ish reference sets, not growth data. Fine as a bare list under `data`.

---

## 4. Suppliers API

### 4.1 List Suppliers
* **HTTP Method**: `GET`
* **Endpoint**: `/suppliers`
* **Auth Required**: Yes

**Query Parameters**
* `type` (Optional): `glossary` | `stuff`
* `is_active` (Optional, default `true`)

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": [
    {
      "id": 30,
      "name": "Central Market Meat Vendor",
      "type": "glossary",
      "is_active": true
    }
  ]
}
```

### 4.2 Create Supplier
* **HTTP Method**: `POST`
* **Endpoint**: `/suppliers`
* **Auth Required**: Yes (Manager / Admin)

**Request Body**
```json
{
  "name": "Central Market Meat Vendor",
  "type": "glossary"
}
```

**Response Body (`201 Created`)**
```json
{
  "success": true,
  "data": { "id": 30, "name": "Central Market Meat Vendor", "type": "glossary", "is_active": true }
}
```

### 4.3 Deactivate Supplier
* **HTTP Method**: `PATCH`
* **Endpoint**: `/suppliers/:id/deactivate`
* **Auth Required**: Yes (Manager / Admin)

**Response Body (`200 OK`)**
```json
{ "success": true, "data": { "id": 30, "is_active": false } }
```

---

## 5. Orders (Requisitions) API

### 5.1 List Orders
* **HTTP Method**: `GET`
* **Endpoint**: `/orders`
* **Auth Required**: Yes

**Query Parameters**
* `status` (Optional): `pending` | `approved` | `sent` | `discrepancy` | `completed` | `rejected`
* `request_type` (Optional): `glossary` | `stuff` | `mixed`
* `page`, `limit`

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": [
    {
      "id": 1001,
      "status": "pending",
      "date": "2026-07-10",
      "total_usd": 56.00,
      "total_khr": 18000,
      "fx_rate_used": 4000.00,
      "request_type": "mixed",
      "priority": "normal",
      "delivery_date": "2026-07-11",
      "requester_role": "staff",
      "requested_from": "manager",
      "supplier_id": null,
      "created_by": 2,
      "approved_by": null,
      "approved_at": null,
      "sent_at": null,
      "completed_at": null,
      "notes": "Daily stock refill + Cooking Gas Refill"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 412, "total_pages": 21 }
}
```

---

### 5.2 Create Order
* **HTTP Method**: `POST`
* **Endpoint**: `/orders`
* **Auth Required**: Yes
* **Required Header**: `Idempotency-Key`

**Request Body**
```json
{
  "request_type": "mixed",
  "priority": "normal",
  "delivery_date": "2026-07-11",
  "requested_from": "manager",
  "notes": "Daily stock refill + Cooking Gas Refill",
  "items": [
    {
      "ingredient_id": 101,
      "unit": "kg",
      "ordered": 5.00,
      "estimated_price": 7.50,
      "supplier_notes": "Trim excess fat"
    },
    {
      "ingredient_id": 204,
      "unit": "tank",
      "ordered": 1.00,
      "estimated_price": 18.00,
      "supplier_notes": "Reason: Kitchen operational fuel backup"
    }
  ]
}
```
> `name` is no longer accepted in the request for catalog items — the server resolves it from `ingredient_id` server-side, so a stale client can't overwrite the canonical ingredient name. It's only writable for custom items where `ingredient_id` is omitted.

**Response Body (`201 Created`)**
```json
{
  "success": true,
  "data": {
    "id": 1001,
    "status": "pending",
    "date": "2026-07-10",
    "total_usd": 55.50,
    "total_khr": 0,
    "fx_rate_used": 4000.00,
    "request_type": "mixed",
    "priority": "normal",
    "delivery_date": "2026-07-11",
    "requester_role": "staff",
    "requested_from": "manager",
    "supplier_id": null,
    "created_by": 2,
    "approved_by": null,
    "approved_at": null,
    "notes": "Daily stock refill + Cooking Gas Refill",
    "items": [
      {
        "id": 5001,
        "order_id": 1001,
        "ingredient_id": 101,
        "name": "Pork Belly",
        "unit": "kg",
        "ordered": 5.00,
        "received": null,
        "estimated_price": 7.50,
        "actual_price": null,
        "actual_price_currency": null,
        "discrepancy_reason": null,
        "supplier_notes": "Trim excess fat",
        "packing_status": "pending"
      },
      {
        "id": 5002,
        "order_id": 1001,
        "ingredient_id": 204,
        "name": "Cooking Gas Tank Refill 15kg",
        "unit": "tank",
        "ordered": 1.00,
        "received": null,
        "estimated_price": 18.00,
        "actual_price": null,
        "actual_price_currency": null,
        "discrepancy_reason": null,
        "supplier_notes": "Reason: Kitchen operational fuel backup",
        "packing_status": "pending"
      }
    ]
  }
}
```

`fx_rate_used` is auto-populated server-side from the most recent `exchange_rates` row for this `restaurant_id` as of `date` — clients never supply it. If no rate has been set yet for the restaurant, the request fails with `422` (`code: "NO_EXCHANGE_RATE_SET"`), rather than silently falling back to a hardcoded default.

---

### 5.3 Approve or Reject Order
* **HTTP Method**: `PATCH`
* **Endpoint**: `/orders/:id`
* **Auth Required**: Yes (Manager only)

**Request Body (Approve)**
```json
{ "status": "approved" }
```

**Request Body (Reject)**
```json
{ "status": "rejected", "notes": "Budget exceeded for this category this month" }
```

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": {
    "id": 1001,
    "status": "approved",
    "approved_by": 1,
    "approved_at": "2026-07-10T13:25:00.000Z",
    "updated_at": "2026-07-10T13:25:00.000Z"
  }
}
```

---

### 5.4 Delivery Check-In & Verification
* **HTTP Method**: `PATCH` *(changed from `PUT` in v1 — see changelog #4)*
* **Endpoint**: `/orders/:id/checkin`
* **Auth Required**: Yes (Receiver / Manager)

**Request Body**
```json
{
  "items": [
    {
      "id": 5001,
      "received": 5.00,
      "actual_price": 7.50,
      "actual_price_currency": "USD",
      "packing_status": "packed"
    },
    {
      "id": 5002,
      "received": 1.00,
      "actual_price": 76000,
      "actual_price_currency": "KHR",
      "packing_status": "flagged",
      "discrepancy_reason": "Price surcharge applied at gas depot"
    }
  ]
}
```

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": {
    "id": 1001,
    "status": "completed",
    "total_usd": 37.50,
    "total_khr": 76000,
    "completed_at": "2026-07-11T07:30:00.000Z",
    "items": [
      {
        "id": 5001,
        "received": 5.00,
        "actual_price": 7.50,
        "actual_price_currency": "USD",
        "packing_status": "packed"
      },
      {
        "id": 5002,
        "received": 1.00,
        "actual_price": 76000,
        "actual_price_currency": "KHR",
        "packing_status": "flagged",
        "discrepancy_reason": "Price surcharge applied at gas depot"
      }
    ],
    "linked_transaction": {
      "id": 8009,
      "type": "outcome",
      "category_id": 5,
      "amount": 37.50,
      "currency": "USD",
      "linked_order_id": 1001,
      "description": "Auto-linked market order 1001 outcomes",
      "date": "2026-07-11"
    }
  }
}
```

> Retrying this call (e.g. after a client timeout) on an order that's already `completed` returns `409 Conflict` (`code: "ORDER_ALREADY_CHECKED_IN"`) rather than silently creating a second `linked_transaction` — this is enforced at the DB layer by the unique constraint on `transactions.linked_order_id`, but the API should surface it as a clean 409 rather than a raw constraint-violation 500.

---

## 6. Transactions (Finance) API

### 6.1 List Transactions
* **HTTP Method**: `GET`
* **Endpoint**: `/transactions`
* **Auth Required**: Yes (Manager / Accounting)

**Query Parameters**
* `start_date` (Optional): `YYYY-MM-DD`
* `end_date` (Optional): `YYYY-MM-DD`
* `type` (Optional): `income` | `outcome`
* `page`, `limit`

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": [
    {
      "id": 8001,
      "type": "income",
      "category_id": 1,
      "amount": 1420.00,
      "currency": "USD",
      "fx_rate_used": 4000.00,
      "description": "Dinner shift total sales (Malis Main Dining)",
      "date": "2026-07-08",
      "created_by": 1,
      "linked_order_id": null,
      "payment_method": "aba_pay",
      "receipt_ref": "REC-9920",
      "khqr_ref": null,
      "created_at": "2026-07-08T22:15:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 96, "total_pages": 5 }
}
```

---

### 6.2 Create Transaction
* **HTTP Method**: `POST`
* **Endpoint**: `/transactions`
* **Auth Required**: Yes (Manager / Accounting)
* **Required Header**: `Idempotency-Key`

**Request Body**
```json
{
  "type": "outcome",
  "category_id": 6,
  "amount": 450.00,
  "currency": "USD",
  "description": "Monthly commercial electricity utility bill",
  "date": "2026-07-10",
  "payment_method": "bank_transfer",
  "receipt_ref": "ELEC-2026-07"
}
```

**Response Body (`201 Created`)**
```json
{
  "success": true,
  "data": {
    "id": 8002,
    "type": "outcome",
    "category_id": 6,
    "amount": 450.00,
    "currency": "USD",
    "fx_rate_used": 4000.00,
    "description": "Monthly commercial electricity utility bill",
    "date": "2026-07-10",
    "created_by": 1,
    "linked_order_id": null,
    "payment_method": "bank_transfer",
    "receipt_ref": "ELEC-2026-07",
    "khqr_ref": null,
    "created_at": "2026-07-10T13:27:00.000Z"
  }
}
```

---

## 7. Finance Categories API

### 7.1 List Finance Categories
* **HTTP Method**: `GET`
* **Endpoint**: `/finance-categories`
* **Auth Required**: Yes

**Query Parameters**
* `type` (Optional): `income` | `outcome`

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Sales Revenue", "type": "income", "sort_order": 1 },
    { "id": 6, "name": "Utilities", "type": "outcome", "sort_order": 6 }
  ]
}
```

---

## 8. Budget Limits API

### 8.1 Get Budget Progress
* **HTTP Method**: `GET`
* **Endpoint**: `/budgets`
* **Auth Required**: Yes

**Query Parameters**
* `month`: `YYYY-MM` (e.g. `2026-07`)

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": [
    {
      "id": 10,
      "category_id": 5,
      "monthly_limit": 2000.00,
      "currency": "USD",
      "current_spent": 1245.50,
      "month": "2026-07"
    }
  ]
}
```

---

### 8.2 Set Budget Limit
* **HTTP Method**: `PUT` *(URL now carries the natural key — see changelog #5)*
* **Endpoint**: `/budgets/:category_id/:month`
* **Auth Required**: Yes (Manager / Admin)

**Request Body**
```json
{
  "monthly_limit": 2500.00,
  "currency": "USD"
}
```

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "category_id": 5,
    "monthly_limit": 2500.00,
    "currency": "USD",
    "current_spent": 1245.50,
    "month": "2026-07"
  }
}
```

---

## 9. Exchange Rates API

### 9.1 List Exchange Rates
* **HTTP Method**: `GET`
* **Endpoint**: `/exchange-rates`
* **Auth Required**: Yes

**Query Parameters**
* `start_date`, `end_date` (Optional)

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": [
    { "id": 30, "rate_date": "2026-07-10", "usd_to_khr": 4120.00, "restaurant_id": 12 }
  ]
}
```

### 9.2 Set Exchange Rate
* **HTTP Method**: `PUT` *(URL now carries the natural key — see changelog #5)*
* **Endpoint**: `/exchange-rates/:rate_date`
* **Auth Required**: Yes (Admin / Manager)

**Request Body**
```json
{ "usd_to_khr": 4120.00 }
```

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": {
    "id": 30,
    "rate_date": "2026-07-10",
    "usd_to_khr": 4120.00,
    "restaurant_id": 12,
    "created_at": "2026-07-10T13:30:00.000Z"
  }
}
```

---

## 10. Users API

### 10.1 List Users
* **HTTP Method**: `GET`
* **Endpoint**: `/users`
* **Auth Required**: Yes (Manager / Admin)

**Query Parameters**
* `role` (Optional)
* `is_active` (Optional, default `true`)

**Response Body (`200 OK`)**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Manager Dara", "username": "dara_manager", "role": "manager", "is_active": true }
  ]
}
```

### 10.2 Deactivate User
* **HTTP Method**: `PATCH`
* **Endpoint**: `/users/:id/deactivate`
* **Auth Required**: Yes (Manager / Admin)

**Response Body (`200 OK`)**
```json
{ "success": true, "data": { "id": 5, "is_active": false } }
```
