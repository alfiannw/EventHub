# SPRINT 3: API ROUTES SPECIFICATION (PARTICIPANT REGISTRATION)

Below is the complete REST API documentation for the **Participant Registration & RSVP Core Module**.

## Base Path
`http://localhost:3000/api/registration`

---

## Endpoint Summary

| Method | Endpoint | Description | Auth Required | Access Level |
|--------|----------|-------------|---------------|--------------|
| `POST` | `/register` | Register a new attendee profile & RSVP | No (Public) | Anyone |
| `GET` | `/participants` | List all registered participants | Yes | `ADMIN`, `MANAGER` |
| `GET` | `/participants/:id` | Retrieve single participant profile by ID | Yes | `GUEST` (Self), `ADMIN`, `MANAGER` |
| `GET` | `/participants/email/:email` | Find registration by email address | No | Public / Client Form |
| `PUT` | `/participants/:id` | Update registration profile | Yes | `GUEST` (Self), `ADMIN` |
| `DELETE`| `/participants/:id` | Revoke registration & wipe attendee record | Yes | `ADMIN` |
| `GET` | `/stats` | Aggregate metrics on RSVPs and seat capacity | Yes | `ADMIN`, `MANAGER` |

---

## Detailed Contract Specifications

### 1. Register Attendee
* **Endpoint:** `POST /api/registration/register`
* **Content-Type:** `application/json`
* **Request Payload:**
  ```json
  {
    "name": "Liam O'Connor",
    "email": "liam.oc@atlassian.com",
    "phone": "+61 2 9876 5432",
    "company": "Atlassian Corp.",
    "position": "Senior Event Coordinator",
    "rsvpStatus": "YES",
    "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "id": "p-1720374182910-449",
    "name": "Liam O'Connor",
    "email": "liam.oc@atlassian.com",
    "phone": "+61 2 9876 5432",
    "company": "Atlassian Corp.",
    "position": "Senior Event Coordinator",
    "rsvpStatus": "YES",
    "qrCode": "EH-QR-1720374182910-82",
    "checkedIn": false,
    "points": 5,
    "tableNumber": "Table 4",
    "seatNumber": "Seat B-3",
    "createdAt": "2026-07-07T15:13:00.000Z",
    "updatedAt": "2026-07-07T15:13:00.000Z"
  }
  ```
* **Error Response (409 Conflict):**
  ```json
  {
    "statusCode": 409,
    "message": "A participant with email \"liam.oc@atlassian.com\" is already registered.",
    "error": "Conflict"
  }
  ```

---

### 2. Get All Participants
* **Endpoint:** `GET /api/registration/participants`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  [
    {
      "id": "p-1",
      "name": "Alex Rivera",
      "email": "alex.rivera@meta.com",
      "rsvpStatus": "YES",
      "tableNumber": "Table 1",
      "seatNumber": "Seat A-1"
    }
  ]
  ```

---

### 3. Aggregate RSVP Statistics
* **Endpoint:** `GET /api/registration/stats`
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Success Response (200 OK):**
  ```json
  {
    "totalCount": 3,
    "yesCount": 2,
    "noCount": 0,
    "pendingCount": 1,
    "responseRate": 100,
    "checkedInCount": 1
  }
  ```
