# WebOS Backend API Contracts

This document defines the REST API contract for a future backend implementation to support multi-device syncing of the WebOS filesystem and window layouts.

## Base URL
`/api/v1`

---

## Filesystem Endpoints

### 1. Get File Tree
**GET** `/fs/tree`

Retrieves the entire filesystem tree for the authenticated user.

- **Request Payload:** None
- **Response Schema:**
  ```json
  {
    "items": [
      {
        "id": "string",
        "name": "string",
        "type": "folder|file",
        "parentId": "string|null",
        "createdAt": "number (timestamp)"
      }
    ],
    "version": "string (etag or revision number)"
  }
  ```

### 2. Create Item
**POST** `/fs/items`

- **Request Payload:**
  ```json
  {
    "name": "string",
    "type": "folder|file",
    "parentId": "string|null"
  }
  ```
- **Response Schema:** Returns the created item schema.
- **Errors:** 
  - `409 Conflict` (Duplicate name in parent)
  - `400 Bad Request` (Invalid name)

### 3. Update Item (Rename / Move)
**PATCH** `/fs/items/:id`

- **Request Payload:**
  ```json
  {
    "name": "string (optional)",
    "parentId": "string|null (optional)",
    "expectedVersion": "string (for optimistic concurrency)"
  }
  ```
- **Response Schema:** Returns the updated item schema.
- **Errors:** 
  - `409 Conflict` (Version mismatch or duplicate name)
  - `404 Not Found`

### 4. Delete Item
**DELETE** `/fs/items/:id`

- **Request Payload:** None
- **Response Schema:** `204 No Content`
- **Behavior:** Should recursively delete all descendants if the target is a folder.

### 5. Duplicate Item
**POST** `/fs/items/:id/copy`

- **Request Payload:** None
- **Response Schema:** Returns an array of newly created item schemas (including recursive children copies if folder).

---

## Window Manager Endpoints

### 1. Get Window Layout
**GET** `/windows/layout`

Retrieves the saved window layout (position, size, maximized state, Z-index order).

- **Request Payload:** None
- **Response Schema:**
  ```json
  {
    "windows": [
      {
        "id": "string",
        "appType": "string",
        "payload": "any",
        "position": { "x": "number", "y": "number" },
        "size": { "width": "number", "height": "number" },
        "maximized": "boolean",
        "minimized": "boolean",
        "zIndex": "number"
      }
    ]
  }
  ```

### 2. Update Window Layout
**PUT** `/windows/layout`

Overwrites the saved window layout. Used when closing the browser or debounced periodically.

- **Request Payload:** 
  *(Same as the response schema for GET `/windows/layout`)*
- **Response Schema:** `200 OK`

---

## Concurrency & Sync Strategy

The frontend will use a local-first approach (IndexedDB). 
When connected to the network:
1. Fetch `/fs/tree` on boot.
2. If the server `version` is newer than the local IndexedDB version, perform a merge or server-wins overwrite.
3. Every mutating action (Create, Rename, Delete, Move) runs locally first (optimistic UI), then dispatches the corresponding REST call in the background.
4. If a REST call fails with `409 Conflict`, the frontend must refetch `/fs/tree` and gracefully reconcile the state.
