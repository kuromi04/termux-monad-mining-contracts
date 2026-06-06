# Implementation Tasks: QP Dashboard

This document outlines the step-by-step task checklist required to implement the QP Dashboard (`/dashboard`) route, integrate global navigation, simplify the home page, and add contract owner administration.

---

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Update `packages/nextjs/components/Header.tsx` to include the "/dashboard" route in the navigation `menuLinks` list. Use the label `"QP Dashboard"` and ensure it is rendered in both the desktop navbar and mobile dropdown.
- [x] 1.2 Create the directory `packages/nextjs/app/dashboard` if it doesn't exist, and create the page component file `packages/nextjs/app/dashboard/page.tsx` with a basic shell containing imports for `wagmi`, Scaffold-ETH hooks, and DaisyUI layout.

---

## Phase 2: Core Implementation

- [x] 2.1 Set up role-based access control (RBAC) in `packages/nextjs/app/dashboard/page.tsx`. Use `useAccount` to retrieve the connected wallet address, and use `useScaffoldReadContract` to fetch:
  - `whitelistedQP` status for the connected address.
  - `owner` address of the `MiningRegistry` contract.
- [x] 2.2 Implement the "Access Denied" view in the dashboard. If the connected wallet is neither a whitelisted QP nor the contract owner, render a stylized "Access Denied / Request Authorization" card in obsidian/dark slate theme.
- [x] 2.3 Implement the Whitelist Status Profile Card for whitelisted QPs. The card must:
  - Display the connected address using the Scaffold-ETH `<Address />` component.
  - Display a glowing/pulsing green status badge indicating authorized QP status.
  - Display the supported standards ("NI 43-101" and "ECRR 2018").
- [x] 2.4 Implement the client-side certificate querying loop to compute signing stats. Read `nextTokenId` using `useScaffoldReadContract`, iterate from `1` to `nextTokenId` (handling potential revert states/gaps gracefully), and query `getCertificate(tokenId)` to filter certificates registered by the connected QP address.
- [x] 2.5 Display the number of signed certificates in the Whitelist Status Profile Card.
- [x] 2.6 Implement the Certificate Registration Form for authorized QPs:
  - Fields: Title ID (input text), Standard (select picker: NI 43-101 / ECRR 2018), Initial Category (select picker: INFERRED / INDICATED / MEASURED), Cut-off grade in bps (integer input), Tonnage (integer input), and GeoHash (input text).
  - Validation: Tonnage must be > 0, Cut-off grade must be >= 0, Title ID and GeoHash must be non-empty. Disable the submit button if inputs are invalid.
  - Write Action: Call `registerCertificate` via the `useScaffoldWriteContract` hook. Disable the button during mining (`isMining === true`) and clear the inputs on success.
- [x] 2.7 Implement the Resource Escalator Table for the QP's registered certificates:
  - Render a responsive table/list displaying the QP's certificates (Token ID, Title ID, Standard, Category badge, Cut-off, Tonnage, and GeoHash).
  - For each certificate, display an interactive step/timeline of CRIRSCO categories (INFERRED -> INDICATED -> MEASURED).
  - Provide a one-click button to advance the category consecutively (e.g. if current category is INFERRED, show "Advance to INDICATED").
  - Write Action: Call `advanceCategory` via `useScaffoldWriteContract`. Disable the button if the category is already `MEASURED` or if a transaction is pending.
- [x] 2.8 Implement the Owner-only Admin Panel on the same page. If the connected address matches the contract `owner()`:
  - Provide an input field using `<AddressInput />` to specify the target QP address.
  - Include a standard compliance picker (NI 43-101 or ECRR 2018) for UI compliance.
  - Write Action: Call `whitelistQP(address)` via `useScaffoldWriteContract`. Clear the address input field upon successful transaction confirmation.

---

## Phase 3: Wiring / Integration

- [x] 3.1 Refactor the public home page `packages/nextjs/app/page.tsx` to simplify it:
  - Remove the write/registration form and its associated state.
  - Remove the QP whitelist status badge and connection helper text.
  - Keep the public lookup card ("Verificar título") to search certificates by Token ID.
  - Remove the "Avanzar a next category" button from the public certificate details card.
- [x] 3.2 Harmonize UI styling across `/` and `/dashboard` using Tailwind CSS v4 variables and DaisyUI v5 utilities, ensuring obsidian-like glassmorphic theme elements, glow borders, and clean layout proportions.

---

## Phase 4: Verification / Testing

- [ ] 4.1 Perform manual testing of navigation highlighting to confirm that "Home", "Debug Contracts", and "QP Dashboard" reflect the active route state using active CSS classes (`bg-secondary shadow-md`).
- [ ] 4.2 Verify client-side access controls:
  - Connect a non-authorized wallet and verify "Access Denied" page renders.
  - Connect a whitelisted QP wallet and verify the Status, Form, and Escalator render, while the Admin Panel is hidden.
  - Connect the contract owner wallet and verify the Admin Panel renders.
- [ ] 4.3 Verify form input validation:
  - Attempt to submit a certificate registration with 0 tonnage, and verify the transaction is blocked.
  - Attempt to submit an admin whitelist without an address, and verify it is blocked.
- [ ] 4.4 Verify transaction flows:
  - Whitelist a new QP address from the Admin Panel.
  - Connect the newly whitelisted QP, register a new certificate, and verify it appears in the Resource Escalator table.
  - Advance the category of the new certificate and verify the state transition is correctly persisted.
