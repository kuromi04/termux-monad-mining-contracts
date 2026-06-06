# QP Dashboard Specification

## Purpose

Provides a dedicated interface at `/dashboard` for Qualified Persons (QPs) to check their authorization status, register new mining certificates, and escalate resource categories.

## Requirements

### Requirement: Access Control

The `/dashboard` route MUST enforce role-based user interface visibility based on the connected Web3 wallet.
- The QP Dashboard elements (Status Card, Registration Form, Resource Escalator) MUST only be visible if the connected wallet address is a whitelisted QP.
- The Admin Panel elements MUST only be visible if the connected wallet is the contract `owner()`.
- An "Access Denied" view MUST be displayed if the connected wallet is neither a whitelisted QP nor the owner.

#### Scenario: Whitelisted QP Accesses Dashboard
- GIVEN a connected wallet address that is whitelisted as a QP
- AND the wallet is not the contract owner
- WHEN the user navigates to `/dashboard`
- THEN the system MUST render the Whitelist Status Card, Certificate Registration Form, and Resource Escalator
- AND the system MUST NOT render the Admin Settings Panel

#### Scenario: Non-Authorized Wallet Accesses Dashboard
- GIVEN a connected wallet address that is neither a whitelisted QP nor the contract owner
- WHEN the user navigates to `/dashboard`
- THEN the system MUST render an "Access Denied" message instructing the user to contact the administrator

---

### Requirement: Whitelist Status Card

The Whitelist Status Card MUST display the connected wallet's QP profile and status using blockchain reads.
- The card MUST display the connected wallet address using the Scaffold-ETH 2 `<Address />` component.
- The card MUST display an active status badge (e.g., "Qualified Person (QP) Authorized").
- The card MUST display the authorized standard (e.g., "NI 43-101" or "ECRR 2018").
- All contract reads MUST be performed via the `useScaffoldReadContract` hook.

#### Scenario: Display QP Status Information
- GIVEN a connected wallet address that is whitelisted as a QP
- WHEN the Whitelist Status Card loads
- THEN the system MUST use `useScaffoldReadContract` to query `whitelistedQP`
- AND the system MUST display the address via `<Address />`
- AND the system MUST display the authorized standard badge

---

### Requirement: Certificate Registration Form

The Certificate Registration Form MUST allow authorized QPs to submit new mining certificates with client-side input validation.
- The form MUST accept the following inputs:
  - Title ID (non-empty string)
  - Standard (NI 43-101 or ECRR 2018)
  - Initial Category (INFERRED, INDICATED, or MEASURED)
  - Cut-off grade (bps) (MUST be >= 0)
  - Tonnage (MUST be > 0)
  - GeoHash (non-empty string)
- The form MUST validate all input bounds client-side before allowing transaction submission.
- The submit button MUST invoke `registerCertificate` using the `useScaffoldWriteContract` hook.
- The submit button MUST be disabled if inputs are invalid, if no QP is connected, or if a transaction is pending (`isMining` is true).

#### Scenario: Successful Certificate Registration
- GIVEN a connected QP wallet
- AND all form inputs are valid (Tonnage > 0, Cut-off grade >= 0, Title ID and GeoHash are not empty)
- WHEN the user clicks "Registrar certificado"
- THEN the system MUST invoke `registerCertificate` with the form parameters
- AND clear the input fields upon successful transaction confirmation

#### Scenario: Invalid Input Bounds Prevent Submission
- GIVEN a connected QP wallet
- AND the Tonnage input is 0 or negative
- WHEN the user attempts to submit the form
- THEN the system MUST disable the submit button and show a validation error message

---

### Requirement: Resource Escalator

The Resource Escalator MUST display certificates registered by the QP and allow one-click advancement of resource categories.
- The system MUST list certificates that are queried or owned.
- The escalator MUST allow advancing the resource category (INFERRED -> INDICATED -> MEASURED) consecutively.
- The transition MUST follow the order: `INFERRED` (0) -> `INDICATED` (1) -> `MEASURED` (2) consecutively.
- The escalation button MUST invoke `advanceCategory` via the `useScaffoldWriteContract` hook.
- The escalation button MUST be disabled if the certificate category is already `MEASURED` or if a transaction is pending.

#### Scenario: Advancing Certificate Category Consecutively
- GIVEN a certificate with current category `INFERRED`
- WHEN the QP clicks the button to advance the category
- THEN the system MUST invoke `advanceCategory` with the next category parameter `INDICATED`
- AND the button label MUST update to display the next transition target after confirmation
