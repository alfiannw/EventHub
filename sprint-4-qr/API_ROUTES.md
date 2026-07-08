# SPRINT 4: API ROUTES SPECIFICATION (QR CODE TICKET GENERATION)

Below is the complete REST API documentation for the **QR Generation, Formats, and Scan Core Engine**.

## Base Path
`http://localhost:3000/api/qr`

---

## Endpoint Summary

| Method | Endpoint | Description | Auth Required | Access Level |
|--------|----------|-------------|---------------|--------------|
| `GET` | `/tickets` | List all compiled QR tickets | Yes | `ADMIN`, `MANAGER` |
| `GET` | `/tickets/:id` | Retrieve single QR ticket details | Yes | `ADMIN`, `MANAGER`, `GUEST` (Self) |
| `GET` | `/participant/:id` | Find QR tickets associated with a participant | Yes | `ADMIN`, `MANAGER`, `GUEST` (Self) |
| `POST` | `/generate` | Generate fresh dynamic security code token | Yes | `ADMIN`, `MANAGER` |
| `PUT` | `/tickets/:id/revoke` | Permanently void and invalidate a ticket | Yes | `ADMIN` |
| `POST` | `/scan` | Process gate check-in scan & increment counters | No | Public Gates / Scanner SDK |
| `GET` | `/logs` | Fetch real-time telemetry logs for audit | Yes | `ADMIN` |

---

## Detailed Contract Specifications

### 1. Compile Security Token (Generate QR)
* **Endpoint:** `POST /api/qr/generate`
* **Content-Type:** `application/json`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Payload:**
  ```json
  {
    "participantId": "p-1",
    "format": "QR_CODE",
    "expiresInHours": 72
  }
  ```
* **Success Response (211 Created):**
  ```json
  {
    "id": "qr-1720374182910-141",
    "participantId": "p-1",
    "qrCodeString": "EH-QR-P-1-1720374182910-441",
    "format": "QR_CODE",
    "status": "ACTIVE",
    "scansCount": 0,
    "generatedAt": "2026-07-07T15:19:00.000Z",
    "expiresAt": "2026-07-10T15:19:00.000Z"
  }
  ```

---

### 2. Process Gate Scan (Scan & Validate)
* **Endpoint:** `POST /api/qr/scan`
* **Request Payload:**
  ```json
  {
    "code": "EH-QR-ALEXRIVERA-7719"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "id": "qr-1",
    "participantId": "p-1",
    "qrCodeString": "EH-QR-ALEXRIVERA-7719",
    "format": "QR_CODE",
    "status": "ACTIVE",
    "scansCount": 1,
    "lastScannedAt": "2026-07-07T15:19:20.000Z",
    "generatedAt": "2026-07-07T13:19:00.000Z",
    "expiresAt": "2026-07-09T13:19:00.000Z"
  }
  ```
* **Error Response (400 Bad Request - Revoked):**
  ```json
  {
    "statusCode": 400,
    "message": "Security Alert: This QR code has been revoked and cannot be used for entry.",
    "error": "Bad Request"
  }
  ```
