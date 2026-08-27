# Birchwood — Security & QA Audit

**Date:** August 27, 2026  
**Scope:** Birchwood_Admin + Birchwood_Backend source review. Not a live penetration test.  
**Rule:** No secret values in this file.

---

## Executive summary

The admin panel and API were audited for authentication, authorization, CRUD validation, and common vulnerability classes. **Critical authorization gaps were found and fixed** in this pass. Admin namespace routes (`/api/admin/*`) were already protected with `adminRoute`. Shared routes had the largest exposure.

**Fixes applied:**
- Activity create/update/delete → `adminRoute` only
- Fee voucher list/detail → `adminRoute` only; child vouchers scoped to parent/teacher/admin
- Homework writes blocked for parents; teacher ownership on update/delete; parent read scoped
- Post update/delete ownership enforced; admin may delete only
- New `Helpers/accessControl.js`
- Admin frontend: `AdminAuthCheck` validates admin JWT on all protected routes

---

## Summary table

| ID | Title | Verdict | Severity |
|---|---|---|---|
| SR-01 | Admin JWT separation | Confirmed (fixed) | High |
| SR-02 | Activity CRUD open to any user | Confirmed (fixed) | Critical |
| SR-03 | Fee vouchers readable by any user | Confirmed (fixed) | High |
| SR-04 | Homework writable by any user | Confirmed (fixed) | High |
| SR-05 | Post update/delete without ownership | Confirmed (fixed) | High |
| SR-06 | Admin namespace routes | Not present | n/a |
| SR-07 | Support ticket access | Not present | n/a |
| SR-08 | Frontend token-only guard | Confirmed (fixed) | High |
| SR-09 | Missing update validators | Partial | Medium |
| SR-10 | Child attendance IDOR | Partial | Medium |

---

## Admin API lock model

| Layer | Mechanism |
|-------|-----------|
| Admin CRUD | `/api/admin/*` → `adminRoute` |
| Activity writes | `adminRoute` |
| Fee admin reads | `adminRoute` |
| Inventory/classroom/fees writes | `adminRoute` |
| Homework | Admin + teacher write; parent read scoped |
| Posts | Author edit; author or admin delete |
| Frontend | `AdminAuthCheck` (admin JWT claims) |

---

## QA checklist — manual tests

1. Parent/teacher token → `POST /api/activity/addActivity` returns 403
2. Parent token → `GET /api/fees/getAllVouchers` returns 403
3. Parent token → homework create/update/delete returns 403
4. Teacher A → cannot delete Teacher B homework
5. User A → cannot delete User B post; admin can delete any post
6. Non-admin JWT in admin app → redirect to signin
7. All create forms reject empty required fields

---

## Remaining recommendations

- Add update validators for all resources
- Apply `assertCanAccessChild` to attendance routes
- Remove legacy admin routes not in sidebar
- Verify production secrets and CORS

Full report path: `Birchwood_Backend/docs/security-source-review.md`
