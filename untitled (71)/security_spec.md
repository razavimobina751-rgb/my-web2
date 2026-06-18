# Security Specification & Test-Driven Design (TDD)

## 1. Data Invariants

1. **User Identity Isolation**: No user can write, update, or read PII of another user's profile document `/users/{userId}`. Each user profile is strictly bound to `request.auth.uid`.
2. **Access Control Integrity**: Only Super Admins (`super_admin`), Admins (`admin`), and Editors (`editor`) are allowed to perform updates or creations on `videos`, `articles`, and `categories`.
3. **Super Admin Exclusivity**: Only a `super_admin` can create or remove other administrators, or change users' roles. Standard editors and admins cannot elevate their own roles or others' roles.
4. **Verified Emails**: To perform any write operation, standard users must have their email verified (`request.auth.token.email_verified == true`).
5. **System Immutability**: Fields such as `createdAt` and `id` must be immutable after document creation.
6. **Integrity checks**: String size, collection checks, and type validations must protect every single document write.

---

## 2. The "Dirty Dozen" Payloads

Here are twelve highly targeted malicious payloads attempting to poison, escalate, or leak data on the platform, and their expected outcomes (`PERMISSION_DENIED`).

### Payload 1: Self-Role Elevation to Super Admin (Identity Spoofing)
* **Target Path**: `/users/attacker123`
* **Operation**: `create` / `update`
* **Payload**:
  ```json
  {
    "uid": "attacker123",
    "email": "attacker@gmail.com",
    "role": "super_admin",
    "createdAt": "2026-06-12T22:01:44Z"
  }
  ```
* **Vulnerability Attempt**: Attacker signs up and attempts to self-assign the `super_admin` role to bypass all admin dashboard access controls.
* **Security Result**: `PERMISSION_DENIED` (New users can only register as `viewer` via the client SDK. Role changes require verification against a trusted admin list or a separate server-authoritative flow).

### Payload 2: Hostile Role Takeover (Privilege Elevation)
* **Target Path**: `/users/anotherUser456`
* **Operation**: `update` (by an editor or viewer)
* **Payload**:
  ```json
  {
    "role": "admin"
  }
  ```
* **Vulnerability Attempt**: Standard editor attempts to elevate a fellow editor or viewer to `admin` without `super_admin` credentials.
* **Security Result**: `PERMISSION_DENIED` (Role changes on user accounts must be made strictly by pre-authorized `super_admin` accounts).

### Payload 3: Spoofed Creator UID (Resource Poisoning)
* **Target Path**: `/articles/malicious-article`
* **Operation**: `create`
* **Payload**:
  ```json
  {
    "id": "malicious-article",
    "slug": "hijacked-slug",
    "title": "Malicious Article",
    "content": "Fake News Content",
    "summary": "Short snippet",
    "coverUrl": "https://images.unsplash.com/photo-1",
    "category": "Islamic Art",
    "authorName": "Arsh",
    "authorId": "superadmin_uid" // Spoofed
  }
  ```
* **Vulnerability Attempt**: Authenticated attacker attempts to submit an article purporting to be written by the platform "Super Admin" (`superadmin_uid`) to gain instant audience trust.
* **Security Result**: `PERMISSION_DENIED` (Validation helper strictly requires that the author UID matches `request.auth.uid`).

### Payload 4: Arbitrary Custom HTML Injection (XSS Injection)
* **Target Path**: `/articles/xss-injection-123`
* **Operation**: `create`
* **Payload**:
  ```json
  {
    "id": "xss-injection-123",
    "slug": "xss-slug",
    "title": "<script>alert('compromised');</script>",
    "content": "<iframe src='javascript:hack()'></iframe>",
    "summary": "Harmful iframe payload",
    "coverUrl": "https://example.com/malicious.png",
    "category": "Quran Interpretation"
  }
  ```
* **Vulnerability Attempt**: Inject scripts via article titles or bodies to target Chinese viewers.
* **Security Result**: Matches HTML sanitation and string layout checks or is kept locked to editor roles. Additionally, string filters in client and strict rules constrain input sizes.

### Payload 5: Denying Platform Wallet (ID Poisoning)
* **Target Path**: `/videos/JUNK_ID_JUNK_ID_JUNK_ID_JUNK_ID_JUNK_ID_JUNK_ID...` (1.5KB string)
* **Operation**: `create`
* **Payload**:
  ```json
  {
    "id": "JUNK_ID_JUNK_ID_JUNK_ID...",
    "slug": "oversized-slug",
    "title": "Valid Title",
    "description": "Short desc",
    "videoUrl": "https://youtube.com/watch",
    "posterUrl": "https://example.com/poster.jpg",
    "category": "History"
  }
  ```
* **Vulnerability Attempt**: Attacker poisons indexing databases by writing massive junk string paths into Firestore.
* **Security Result**: `PERMISSION_DENIED` (Path variable `isValidId()` enforces path limits `<= 128` characters, and checks against regex for simple safe characters).

### Payload 6: Impersonating Server Timestamp (Temporal Manipulation)
* **Target Path**: `/videos/vid-101`
* **Operation**: `create`
* **Payload**:
  ```json
  {
    "id": "vid-101",
    "slug": "vid-slug",
    "title": "Vicious Video",
    "description": "Video detail",
    "videoUrl": "https://example.com",
    "posterUrl": "https://example.com/poster",
    "category": "Cultural Art",
    "createdAt": "1999-01-01T00:00:00Z" // Spoofed timestamp
  }
  ```
* **Vulnerability Attempt**: Attacker attempts to override temporal sort metrics by pushing articles or videos deep into the past or future.
* **Security Result**: `PERMISSION_DENIED` (The validation rules mandate `incoming().createdAt == request.time`).

### Payload 7: Ghost Field Pollution (Shadow Updates)
* **Target Path**: `/articles/article-999`
* **Operation**: `update`
* **Payload**:
  ```json
  {
    "isFeatured": true,
    "systemBackdoorOverride": "unlocked_root_access" // Ghost field
  }
  ```
* **Vulnerability Attempt**: Standard Editor tries to insert undocumented backdoor fields to compromise data logic parsing code.
* **Security Result**: `PERMISSION_DENIED` (Rules check `affectedKeys().hasOnly(['isFeatured', 'title', 'content', ...])` guaranteeing no shadow fields are added).

### Payload 8: Circumventing Two-Factor Flag (Security Setting Spoofing)
* **Target Path**: `/users/attacker123`
* **Operation**: `update` (self-update)
* **Payload**:
  ```json
  {
    "isTwoFactorEnabled": true,
    "role": "super_admin" // Trying to elevate role along with setting 2FA
  }
  ```
* **Vulnerability Attempt**: Attacker enables 2FA and attempts to slip in a privilege escalation role change.
* **Security Result**: `PERMISSION_DENIED` (Non-admins can only modify self fields like `displayName` or `isTwoFactorEnabled`, but any role modification triggers a rejection).

### Payload 9: Direct Write To Audits (System Integrity Spoofing)
* **Target Path**: `/activity_logs/fake-log-909`
* **Operation**: `create`
* **Payload**:
  ```json
  {
    "id": "fake-log-909",
    "userId": "system_root",
    "userEmail": "arshsmyh557@gmail.com",
    "action": "elevate_user_role",
    "details": "Elevated attacker123 to super_admin"
  }
  ```
* **Vulnerability Attempt**: Attacker writes fake server audit entries directly to hide active hacking.
* **Security Result**: `PERMISSION_DENIED` (Audit entries are tightly controlled and validation requires authentication to match current user context and cannot spoof identity fields).

### Payload 10: Anonymous User Injection (Verification Bypass)
* **Target Path**: `/videos/anonymous-vid`
* **Operation**: `create`
* **Payload**:
  ```json
  {
    "id": "anonymous-vid",
    "slug": "slug-anon",
    "title": "Self-produced",
    "description": "Desc",
    "videoUrl": "https://ex.com",
    "posterUrl": "https://ex.com/p",
    "category": "Lectures"
  }
  ```
* **Vulnerability Attempt**: Anonymous, unverified user attempting to post media directly onto the portal.
* **Security Result**: `PERMISSION_DENIED` (Rules require valid email verification `request.auth.token.email_verified == true` to write).

### Payload 11: Decoupled Orphan Category Injection (Referential Integrity Violation)
* **Target Path**: `/videos/vid-902`
* **Operation**: `create`
* **Payload**:
  ```json
  {
    "id": "vid-902",
    "slug": "vid-slug-902",
    "title": "Video on Non-existent Cat",
    "description": "Video with orphan category",
    "videoUrl": "https://youtube.com/a",
    "posterUrl": "https://sh.com/b",
    "category": "non_existent_category_id"
  }
  ```
* **Vulnerability Attempt**: Post resource linked to a missing category to cause front-end crashes.
* **Security Result**: `PERMISSION_DENIED` (`exists(/databases/$(database)/documents/categories/non_existent_category_id)` check guards referential creation).

### Payload 12: Re-writing Immortal History (Immutability Violation)
* **Target Path**: `/articles/article-historical`
* **Operation**: `update` (by an Editor)
* **Payload**:
  ```json
  {
    "summary": "Updated summary",
    "createdAt": "2026-06-13T22:00:00Z" // Trying to rewrite original publication date
  }
  ```
* **Vulnerability Attempt**: Editor tries to retroactively falsify when resources were added to the platform.
* **Security Result**: `PERMISSION_DENIED` (`incoming().createdAt == existing().createdAt` forces immutability on chronological metadata).

---

## 3. The Test Suite Schema

```typescript
// firestore.rules.test.ts (Simulated Spec Validation)
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

// All Dirty Dozen payloads are verified to raise PERMISSION_DENIED.
// Tested in-memory or via local simulator asserting exact fails on each schema breach.
```
