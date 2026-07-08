# API Routes - Sprint 12: Analytics Dashboard Module

This document specifies the REST API endpoints provided by the Analytics Dashboard microservice module under the endpoint prefixes `/api/sprint12/analytics`.

---

## 1. Get Live Event Overview Metrics
* **Path:** `GET /api/sprint12/analytics/overview`
* **Response (200 OK):**
```json
{
  "totalRegistered": 6,
  "checkedInCount": 5,
  "attendanceRate": 83.3,
  "activityCount": 14,
  "totalPoints": 115,
  "avgPoints": 23.0,
  "songCount": 12,
  "totalWinners": 2
}
```

---

## 2. Get Live Check-in and Activity Submission Timelines
* **Path:** `GET /api/sprint12/analytics/timeline`
* **Response (200 OK):**
```json
[
  {
    "timeLabel": "14:00",
    "checkIns": 2,
    "submissions": 4
  },
  {
    "timeLabel": "14:15",
    "checkIns": 1,
    "submissions": 3
  },
  {
    "timeLabel": "14:30",
    "checkIns": 1,
    "submissions": 5
  },
  {
    "timeLabel": "14:45",
    "checkIns": 1,
    "submissions": 2
  }
]
```

---

## 3. Get Audience Points Distribution
* **Path:** `GET /api/sprint12/analytics/distribution`
* **Response (200 OK):**
```json
{
  "doorPrizeTiers": [
    {
      "category": "Bronze Tier Selections",
      "range": "0-10 pts",
      "count": 2
    },
    {
      "category": "Silver Tier Selections",
      "range": "11-20 pts",
      "count": 1
    },
    {
      "category": "Gold Tier Selections",
      "range": "21-99+ pts",
      "count": 2
    }
  ],
  "companyAverages": [
    {
      "company": "Stripe Inc.",
      "avgPoints": 30.0,
      "memberCount": 1
    },
    {
      "company": "Meta Platforms Inc.",
      "avgPoints": 25.0,
      "memberCount": 1
    },
    {
      "company": "Google LLC",
      "avgPoints": 15.0,
      "memberCount": 1
    }
  ]
}
```

---

## 4. Get Top Attendees Leaderboard
* **Path:** `GET /api/sprint12/analytics/leaderboard`
* **Query Parameters:**
  * `limit` (number, optional) - Number of top participants to return. Defaults to 5.
  * `company` (string, optional) - Filter by exact or partial company name.
* **Response (200 OK):**
```json
[
  {
    "id": "p-4",
    "name": "Kofi Mensah",
    "company": "Stripe Inc.",
    "points": 30,
    "position": "Principal Product Designer",
    "checkedIn": true
  }
]
```

---

## 5. Get Real-Time Audit Logs Feed
* **Path:** `GET /api/sprint12/analytics/audit-logs`
* **Query Parameters:**
  * `severity` (string, optional) - Filter by severity: `INFO`, `SUCCESS`, `WARNING`, `ERROR`
  * `limit` (number, optional) - Number of items to return. Defaults to 10.
* **Response (200 OK):**
```json
[
  {
    "id": 12,
    "actorId": "Staff-Spinner-01",
    "role": "Event Staff",
    "action": "LUCKY_DRAW_WIN",
    "details": "Participant Alex Rivera won Grand Prize: MacBook Pro 14 M4 Pro",
    "severity": "SUCCESS",
    "timestamp": "2026-07-07T15:52:00.000Z"
  }
]
```

---

## 6. Reset Mock Data and Statistics State
* **Path:** `POST /api/sprint12/analytics/reset`
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Analytics database states and seeds reset successfully."
}
```
