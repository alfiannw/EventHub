# API Routes - Sprint 10: Door Prize Engine Module

This document specifies the REST API endpoints provided by the Door Prize Engine microservice module under the endpoint prefixes `/api/sprint10/doorprize`.

---

## 1. Get Checked-In Attendees & Eligible Door Prize Tiers
* **Path:** `GET /api/sprint10/doorprize`
* **Query Parameters:**
  * `search` (string, optional) - Filter by attendee name, email, or position.
  * `company` (string, optional) - Filter by exact or partial company name.
  * `tier` (string, optional) - Filter by eligible tier: `GOLD` (21+ pts), `SILVER` (11-20 pts), `BRONZE` (0-10 pts).
  * `claimed` (boolean, optional) - Filter by claim status: `true` or `false`.
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
    "eligibleTier": "Gold Tier Selections",
    "tierLevel": 3,
    "claimed": true,
    "claimedAt": "2026-07-07T15:15:00.000Z",
    "claimId": "claim-12345"
  }
]
```

---

## 2. Claim Door Prize
* **Path:** `POST /api/sprint10/doorprize/claim`
* **Headers:**
  * `Content-Type: application/json`
  * `x-actor-name: <StaffName>` (string, optional) - Authoritative staff actor signing off the reward.
* **Request Body:**
```json
{
  "participantId": "p-1",
  "tier": "Gold Tier Selections"
}
```
* **Response (201 Created):**
```json
{
  "id": "claim-12345",
  "participantId": "p-1",
  "name": "Alex Rivera",
  "eligibleTier": "Gold Tier Selections",
  "claimed": true,
  "claimedAt": "2026-07-07T15:30:00.000Z",
  "actorId": "Staff-Desk-01"
}
```

---

## 3. Retrieve Door Prize Claim Logs
* **Path:** `GET /api/sprint10/doorprize/logs`
* **Query Parameters:**
  * `participantId` (string, optional) - Filter logs for a single attendee.
* **Response (200 OK):**
```json
[
  {
    "id": "claim-12345",
    "participantId": "p-1",
    "name": "Alex Rivera",
    "company": "Meta Platforms Inc.",
    "tier": "Gold Tier Selections",
    "claimedAt": "2026-07-07T15:30:00.000Z",
    "actorId": "Staff-Desk-01"
  }
]
```

---

## 4. Get Door Prize Metrics & Stats Dashboard
* **Path:** `GET /api/sprint10/doorprize/stats`
* **Response (200 OK):**
```json
{
  "totalClaims": 12,
  "claimsByTier": {
    "Bronze Tier Selections": 5,
    "Silver Tier Selections": 5,
    "Gold Tier Selections": 2
  },
  "eligibilityDistribution": {
    "Bronze Tier Selections": 18,
    "Silver Tier Selections": 12,
    "Gold Tier Selections": 4
  },
  "totalCheckedInEligible": 34,
  "claimRatePercent": 35.3
}
```

---

## 5. Reset Door Prize Claims
* **Path:** `POST /api/sprint10/doorprize/reset`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Door prize redemptions have been reset successfully."
}
```
