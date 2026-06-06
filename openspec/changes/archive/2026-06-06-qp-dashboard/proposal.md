# Change Proposal: QP Dashboard

## Executive Summary
This proposal introduces a dedicated Qualified Person (QP) Dashboard at `/dashboard` to separate the technical registration and resource classification advancement flows from the public lookup/verification interface on the main page. It also integrates an Owner-only Admin Panel on the same page for managing QP whitelisting.

---

## 1. Capabilities

### 1.1 New Capabilities
* **`qp-dashboard`**: A dedicated route (`/dashboard`) accessible to connected Web3 wallets. It displays:
  * **Whitelist Status Profile Card**: Connects to the user's active wallet, displaying status badge (whitelisted QP vs. non-authorized user), authorized standards (NI 43-101 or ECRR 2018), and signing stats. Uses Scaffold-ETH 2's `<Address />`.
  * **Certificate Registration Form**: Grouped input fields using Scaffold-ETH 2 display components for secure inputs. Validates input bounds client-side before submission.
  * **Interactive Resource Escalator / Asset Manager**: A list/table of active certificates allowing QPs to advance resource categories (INFERRED -> INDICATED -> MEASURED) consecutively with one-click triggers.
* **`admin-panel`**: An admin whitelisting interface visible exclusively to the contract `owner()`. It allows the contract owner to authorize new QPs by passing their addresses to `whitelistQP(address)` via Scaffold-ETH 2's `<AddressInput />` component.

### 1.2 Modified Capabilities
* **`navigation`**: Adding a "QP Dashboard" link in the global navbar (`Header.tsx`) to allow users to navigate between the public home page and the `/dashboard` route.
* **`public-home`**: Simplify the root page (`packages/nextjs/app/page.tsx`) by removing the write form, leaving it dedicated to certificate lookup/verification for public/investor use.

---

## 2. High-Level Approach

1. **Dedicated Route (`/dashboard`)**:
   * Create `packages/nextjs/app/dashboard/page.tsx`.
   * Implement access-control UI: If the wallet is connected but not whitelisted as a QP (and not the contract owner), render a premium "Access Denied / Request Authorization" view with instructions.
   * If the connected wallet is a whitelisted QP:
     * Display the **Whitelist Status Profile Card** showing their address via `<Address />`.
     * Render the **Certificate Registration Form** with input validation.
     * Render the **Resource Escalator / Asset Manager** table. We will fetch existing certificates using `getCertificate` loop up to `nextTokenId` or show a lookup tool specifically for managing their assets.
   * If the connected wallet is the contract owner (`owner()`):
     * Render the **Admin Settings Panel** allowing them to input and whitelist new QP addresses using `<AddressInput />`.
2. **Navigation Integration**:
   * Add a new entry to `menuLinks` in `packages/nextjs/components/Header.tsx` mapping to `/dashboard`.
3. **Contract Interactions**:
   * **Reading**: Use `useScaffoldReadContract` to check `whitelistedQP(address)`, `owner()`, `nextTokenId()`, and `getCertificate(tokenId)`.
   * **Writing**: Use `useScaffoldWriteContract` to execute `registerCertificate`, `advanceCategory`, and `whitelistQP`.

---

## 3. Affected Modules & Packages

### 3.1 Next.js Frontend (`packages/nextjs`)
* **`packages/nextjs/components/Header.tsx`**: Add the new "QP Dashboard" navigation link.
* **`packages/nextjs/app/dashboard/page.tsx`** (New File): The entry point for the QP Dashboard and Admin Panel, including styling aligned with DaisyUI and Tailwind CSS v4 variables.
* **`packages/nextjs/app/page.tsx`**: Clean up the registration form layout to keep the home page simple and consumer-oriented.

---

## 4. Risks & Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Unauthorized write attempts** | Medium | The smart contract restricts functions (`registerCertificate`, `advanceCategory`, `whitelistQP`) via modifier checks. The UI will mirror this check by checking `whitelistedQP(address)` and `owner()`, styling components accordingly, disabling write buttons, and displaying explicit errors. |
| **Asset retrieval scalability** | Low | Querying certificates iteratively via `getCertificate` up to `nextTokenId` might run into latency on large counts. For this dashboard, we will implement a clean list showing recent or queried assets, or use standard Scaffold-ETH hook state management. |
| **Form input validation errors** | Low | Out-of-bounds parameters (e.g., negative tonnage or incorrect geohash) will be validated client-side before triggering transactions. |

---

## 5. Rollback Plan

In case of critical failures or deployment rejection, the changes can be reverted by running the following commands in the workspace:
1. Revert navigation and main page changes:
   ```bash
   git checkout -- packages/nextjs/components/Header.tsx packages/nextjs/app/page.tsx
   ```
2. Delete the dashboard route directory:
   ```bash
   rm -rf packages/nextjs/app/dashboard
   ```
3. Discard the proposal spec files:
   ```bash
   rm -f openspec/changes/qp-dashboard/proposal.md
   ```
