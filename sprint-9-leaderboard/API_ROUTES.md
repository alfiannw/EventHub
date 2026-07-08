# API Routes - Sprint 9: Leaderboard & Milestones Module

This document specifies the REST API endpoints provided by the Leaderboard and Milestones microservice module under the endpoint prefixes `/api/sprint9/leaderboard`.

---

## 1. Get Sorted Leaderboard Standings
* **Path:** `GET /api/sprint9/leaderboard`
* **Query Parameters:**
  * `search` (string, optional) - Filter by attendee name, email, or position.
  * `company` (string, optional) - Filter by exact or partial company name.
  * `tier` (string, optional) - Filter by tier: `GOLD` (25+ pts), `SILVER` (11-24 pts), `BRONZE` (5-10 pts).
* **Response (200 OK):**
```json
[
  {
    "rank": 1,
    "participantId": "p-1",
    "name": "Alex Rivera",
    "email": "alex.rivera@meta.com",
    "company": "Meta Platforms Inc.",
    "position": "Senior Staff Engineer",
    "points": 25,
    "checkedIn": true,
    "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "unlockedMilestones": ["BRONZE_PASS", "SILVER_LOUNGE"]
  }
]
```

---

## 2. Adjust Participant Points
* **Path:** `POST /api/sprint9/leaderboard/adjust`
* **Headers:**
  * `Content-Type: application/json`
  * `x-actor-name: <StaffName>` (string, optional) - Authoritative staff actor signing off the point adjustment.
* **Request Body:**
```json
{
  "participantId": "p-1",
  "pointsDelta": 10,
  "reasonCode": "SPOT_AWARD",
  "description": "Winner of the SaaS security trivia"
}
```
* **Response (201 Created):**
```json
{
  "id": "log-score-12345",
  "participantId": "p-1",
  "pointsDelta": 10,
  "currentTotal": 35,
  "reasonCode": "SPOT_AWARD",
  "description": "Winner of the SaaS security trivia",
  "actorId": "Staff-Desk-01",
  "createdAt": "2026-07-07T15:00:00.000Z"
}
```

---

## 3. Retrieve Score Adjustment Logs
* **Path:** `GET /api/sprint9/leaderboard/logs`
* **Query Parameters:**
  * `participantId` (string, optional) - Filter logs for a single attendee.
* **Response (200 OK):**
```json
[
  {
    "id": "log-score-12345",
    "participantId": "p-1",
    "pointsDelta": 10,
    "currentTotal": 35,
    "reasonCode": "SPOT_AWARD",
    "description": "Winner of the SaaS security trivia",
    "actorId": "Staff-Desk-01",
    "createdAt": "2026-07-07T15:00:00.000Z"
  }
]
```

---

## 4. Get Unlocked Milestone Rewards
* **Path:** `GET /api/sprint9/leaderboard/milestones`
* **Query Parameters:**
  * `participantId` (string, optional) - Filter milestones for a single attendee.
* **Response (200 OK):**
```json
[
  {
    "id": "m-1",
    "participantId": "p-1",
    "milestoneName": "BRONZE_PASS",
    "unlockedAt": "2026-07-07T11:00:00.000Z",
    "claimed": true,
    "claimedAt": "2026-07-07T11:30:00.000Z"
  }
]
```

---

## 5. Claim Swag Rewards
* **Path:** `POST /api/sprint9/leaderboard/milestones/claim`
* **Headers:**
  * `Content-Type: application/json`
  * `x-actor-name: <StaffName>`
* **Request Body:**
```json
{
  "participantId": "p-1",
  "milestoneName": "SILVER_LOUNGE"
}
```
* **Response (200 OK):**
```json
{
  "id": "m-2",
  "participantId": "p-1",
  "milestoneName": "SILVER_LOUNGE",
  "unlockedAt": "2026-07-07T11:00:00.000Z",
  "claimed": true,
  "claimedAt": "2026-07-07T15:15:00.000Z"
}
```

---

## 6. Get Metrics & Stats Dashboard
* **Path:** `GET /api/sprint9/leaderboard/stats`
* **Response (200 OK):**
```json
{
  "totalPointsAwarded": 125,
  "averagePointsPerAttendee": 15.6,
  "unlockedMilestonesCount": {
    "BRONZE_PASS": 12,
    "SILVER_LOUNGE": 5,
    "GOLD_RAFFLE_VIP": 2
  },
  "pointsDistributionByCompany": {
    "Meta Platforms Inc.": 25,
    "Google LLC": 15
  },
  "totalScoreAdjustments": 42
}
```

---

## 7. Reset Leaderboard Sim
* **Path:** `POST /api/sprint9/leaderboard/reset`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Leaderboard points and adjustment logs reset successfully."
}
```
