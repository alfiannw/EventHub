# API Routes - Sprint 11: Lucky Draw Wheel Module

This document specifies the REST API endpoints provided by the Lucky Draw Wheel microservice module under the endpoint prefixes `/api/sprint11/luckydraw`.

---

## 1. Get Eligible Checked-In Attendees
* **Path:** `GET /api/sprint11/luckydraw/candidates`
* **Query Parameters:**
  * `search` (string, optional) - Filter by attendee name, email, or position.
  * `company` (string, optional) - Filter by exact or partial company name.
* **Response (200 OK):**
```json
[
  {
    "participantId": "p-1",
    "name": "Alex Rivera",
    "email": "alex.rivera@meta.com",
    "company": "Meta Platforms Inc.",
    "position": "Senior Staff Engineer",
    "points": 25,
    "checkedIn": true,
    "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "isWinner": false
  }
]
```

---

## 2. Record Lucky Draw Winner
* **Path:** `POST /api/sprint11/luckydraw/winner`
* **Headers:**
  * `Content-Type: application/json`
  * `x-actor-name: <StaffName>` (string, optional) - Authoritative staff actor recording the draw.
* **Request Body:**
```json
{
  "participantId": "p-2",
  "prizeTier": "Grand Prize",
  "prizeName": "Apple iPad Pro M4"
}
```
* **Response (201 Created):**
```json
{
  "id": "winner-12345",
  "participantId": "p-2",
  "name": "Sarah Chen",
  "company": "Google LLC",
  "prizeTier": "Grand Prize",
  "prizeName": "Apple iPad Pro M4",
  "drawnAt": "2026-07-07T15:45:00.000Z",
  "actorId": "Staff-Desk-01"
}
```

---

## 3. Retrieve Drawn Winners Logs
* **Path:** `GET /api/sprint11/luckydraw/winners`
* **Response (200 OK):**
```json
[
  {
    "id": "winner-12345",
    "participantId": "p-2",
    "name": "Sarah Chen",
    "company": "Google LLC",
    "prizeTier": "Grand Prize",
    "prizeName": "Apple iPad Pro M4",
    "drawnAt": "2026-07-07T15:45:00.000Z",
    "actorId": "Staff-Desk-01"
  }
]
```

---

## 4. Get Lucky Draw Statistics
* **Path:** `GET /api/sprint11/luckydraw/stats`
* **Response (200 OK):**
```json
{
  "totalWinners": 1,
  "winnersByTier": {
    "Grand Prize": 1,
    "Major Prize": 0,
    "Special Prize": 0
  },
  "totalEligibleCandidates": 33,
  "drawRatePercent": 3.0
}
```

---

## 5. Reset Lucky Draw State
* **Path:** `POST /api/sprint11/luckydraw/reset`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Lucky draw winners have been reset successfully."
}
```
