# SPRINT 5: API ROUTES SPECIFICATION (QR ACCESS CHECK-IN GATE)

Below is the complete REST API documentation for the **QR Check-In Gate & Telemetry Core Module**.

## Base Path
`http://localhost:3000/api/checkin`

---

## Endpoint Summary

| Method | Endpoint | Description | Auth Required | Access Level |
|--------|----------|-------------|---------------|--------------|
| `POST` | `/process` | Process check-in scans & update participant status | No | Public Gates / Scanner SDK |
| `GET` | `/logs` | Fetch real-time check-in telemetry records | Yes | `ADMIN`, `MANAGER` |
| `GET` | `/logs/participant/:id` | Fetch specific participant's check-in log history | Yes | `GUEST` (Self), `ADMIN`, `MANAGER` |
| `GET` | `/stats` | Aggregate gate traffic stats & expected counts | Yes | `ADMIN`, `MANAGER` |

---

## Detailed Contract Specifications

### 1. Process Gate Check-In Scan
* **Endpoint:** `POST /api/checkin/process`
* **Content-Type:** `application/json`
* **Request Payload:**
  ```json
  {
    "qrCodeString": "EH-QR-ALEXRIVERA-7719",
    "gateName": "West VIP Entrance",
    "scannedBy": "Station_Delta_05"
  }
  ```
* **Success Response (200 OK - Approved):**
  ```json
  {
    "id": "log-1720374182910-118",
    "participantId": "p-1",
    "ticketId": "qr-1",
    "gateName": "West VIP Entrance",
    "scannedBy": "Station_Delta_05",
    "status": "SUCCESS",
    "checkedInAt": "2026-07-07T15:23:00.000Z"
  }
  ```
* **Success Response (200 OK - Flagged Double Scan):**
  ```json
  {
    "id": "log-1720374182910-910",
    "participantId": "p-1",
    "ticketId": "qr-1",
    "gateName": "West VIP Entrance",
    "scannedBy": "Station_Delta_05",
    "status": "FLAGGED",
    "failureReason": "Double scan detected. This ticket has already processed entry.",
    "checkedInAt": "2026-07-07T15:23:45.000Z"
  }
  ```
* **Error Response (404 Not Found - Invalid QR signature):**
  ```json
  {
    "statusCode": 404,
    "message": "Invalid QR code scanned. Ticket signature does not exist.",
    "error": "Not Found"
  }
  ```

---

### 2. Retrieve All Check-In Logs
* **Endpoint:** `GET /api/checkin/logs`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  [
    {
      "id": "log-1",
      "participantId": "p-1",
      "ticketId": "qr-1",
      "gateName": "West VIP Entrance",
      "scannedBy": "GateKeeper_Pro_A",
      "status": "SUCCESS",
      "checkedInAt": "2026-07-07T14:23:00.000Z"
    }
  ]
  ```

---

### 3. Aggregate Gate Traffic Statistics
* **Endpoint:** `GET /api/checkin/stats`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  {
    "totalCheckedIn": 2,
    "totalRegistered": 4,
    "checkInRate": 50,
    "byGate": {
      "West VIP Entrance": 1,
      "East General Gate": 1
    },
    "hourlyDistribution": {
      "08:00": 15,
      "09:00": 42,
      "10:00": 28,
      "11:00": 12,
      "12:00": 2
    }
  }
  ```
