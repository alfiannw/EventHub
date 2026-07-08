# SPRINT 6: API ROUTES SPECIFICATION (LANYARD PASS & BADGE PRINTING)

Below is the complete REST API documentation for the **Lanyard Pass & Badge Printing Core Module**.

## Base Path
`http://localhost:3000/api/badge`

---

## Endpoint Summary

| Method | Endpoint | Description | Auth Required | Access Level |
|--------|----------|-------------|---------------|--------------|
| `GET` | `/jobs` | List all compiled print spooler queues | Yes | `ADMIN`, `MANAGER` |
| `GET` | `/jobs/:id` | Retrieve single print job status and history | Yes | `ADMIN`, `MANAGER` |
| `GET` | `/participant/:id` | Fetch specific participant's badge print records | Yes | `GUEST` (Self), `ADMIN`, `MANAGER` |
| `POST` | `/print` | Queue a fresh badge printing job | Yes | `ADMIN`, `MANAGER` |
| `PUT` | `/jobs/:id/status` | Report print feedback (success/fail) from printer hardware | Yes | `ADMIN`, `MANAGER` |
| `GET` | `/logs` | Fetch hardware telemetry audit trails for printing systems | Yes | `ADMIN` |

---

## Detailed Contract Specifications

### 1. Spool Print Job (Queue Badge for Printing)
* **Endpoint:** `POST /api/badge/print`
* **Content-Type:** `application/json`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Payload:**
  ```json
  {
    "participantId": "p-1",
    "templateType": "STANDARD_PASS",
    "printerId": "PRINTER_MAIN_01"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "id": "job-1720374182910-184",
    "participantId": "p-1",
    "templateType": "STANDARD_PASS",
    "printerId": "PRINTER_MAIN_01",
    "printedBy": "RegistrationDesk_A",
    "status": "PENDING",
    "printAttempts": 0,
    "createdAt": "2026-07-07T15:27:00.000Z"
  }
  ```

---

### 2. Update Job Status (Hardware Callback)
* **Endpoint:** `PUT /api/badge/jobs/:id/status`
* **Content-Type:** `application/json`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Request Payload (Success):**
  ```json
  {
    "success": true
  }
  ```
* **Request Payload (Failure):**
  ```json
  {
    "success": false,
    "failureReason": "Paper feed sensor failure or media out."
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "id": "job-1720374182910-184",
    "participantId": "p-1",
    "templateType": "STANDARD_PASS",
    "printerId": "PRINTER_MAIN_01",
    "printedBy": "RegistrationDesk_A",
    "status": "PRINTED",
    "printAttempts": 1,
    "printedAt": "2026-07-07T15:27:12.000Z",
    "createdAt": "2026-07-07T15:27:00.000Z"
  }
  ```

---

### 3. Retrieve Spooled Queues
* **Endpoint:** `GET /api/badge/jobs`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  [
    {
      "id": "job-1",
      "participantId": "p-1",
      "templateType": "STANDARD_PASS",
      "printerId": "PRINTER_MAIN_01",
      "printedBy": "RegistrationDesk_A",
      "status": "PRINTED",
      "printAttempts": 1,
      "printedAt": "2026-07-07T12:27:00.000Z"
    }
  ]
  ```
