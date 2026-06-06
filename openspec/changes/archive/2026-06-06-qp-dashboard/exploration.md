# Exploration Report: QP Dashboard

This document details the exploration of the `monad-mining-registry` codebase to design and implement a dedicated **Qualified Person (QP) Dashboard** frontend. It outlines options, architectural approaches, component specs, and local environment execution guidelines on Termux.

---

## 1. Current State Analysis

### 1.1 Next.js App Router Structure
The frontend is built on **Scaffold-ETH 2** using Next.js App Router with the following structure:
* **Root Page**: `packages/nextjs/app/page.tsx`
  Currently contains a dual-card layout:
  1. *Registrar título minero* (Write form): Only accessible by connected addresses whitelisted as QPs (`whitelistedQP[address] === true`). Uses basic text inputs, select options, and standard HTML buttons.
  2. *Verificar título* (Read/Write): A public search lookup tool by Token ID. If a certificate exists, it displays details (Title, Standard, Category, Cut-off Grade, Tonnage, QP Signer) and shows an "Avanzar a..." button for whitelisted QPs to promote the resource category.
* **Layout**: `packages/nextjs/app/layout.tsx`
  Configures global providers (wagmi, queryClient, themes, rainbowkit) and renders the Header/Footer wrapper.
* **Style System**: `packages/nextjs/styles/globals.css`
  Uses **Tailwind CSS v4** combined with **DaisyUI v5**. Features light/dark theme variables using custom colors like `#385183` (base) and `#34eeb6` (success).

### 1.2 Smart Contract Methods (`MiningRegistry.sol`)
Our UI interacts with the deployed contract `0x21d2f82d8aa4e33e55a0b60b12ce0c334c387e6d` on Monad Testnet using these key endpoints:
* **`whitelistedQP(address)`** (view): Checks if an address is a whitelisted QP.
* **`owner()`** (view): Returns the contract owner (admin).
* **`whitelistQP(address)`** (write): Owner-only function to authorize a new QP.
* **`registerCertificate(...)`** (write): QP-only function to register and mint a new certificate.
* **`advanceCategory(tokenId, newCategory)`** (write): QP-only function to transition resource categories (INFERRED -> INDICATED -> MEASURED).
* **`getCertificate(tokenId)`** (view): Retrieves the struct data of a certificate.
* **`nextTokenId()`** (view): Retrieves total certificates registered.

---

## 2. Running the Frontend Locally (Termux Context)

Since the repository does not have `node_modules` pre-installed, dependencies must be installed. In a Termux environment, native node package compilation or node/yarn binary invocation may hit glibc mismatch or execution restrictions.

### 2.1 Dependencies Installation Instructions
To run `yarn install` successfully on the Termux host:
1. Ensure the Termux package repository is up-to-date and system dependencies are installed to build any native modules:
   ```bash
   pkg update
   pkg install coreutils make clang python nodejs-lts
   ```
2. Set node package manager and install dependencies from the repository root:
   ```bash
   yarn install
   ```
   *Note: If a Node engine mismatch warning occurs, append `--ignore-engines`.*
3. If running commands via tools inside the editor sandboxes throws glibc errors, execute the dev command directly in the native Termux terminal.

### 2.2 Local Execution
Start the dev server:
```bash
yarn start
```
The server will run on `http://localhost:3000`.

---

## 3. UI/UX Approaches for the QP Dashboard

We need a clean separation of roles: **Investors/Public** (who audit and verify certificates) and **Qualified Persons/Admins** (who manage registry status and upload technical declarations).

### 3.1 Routing Options
We propose three structural layouts:

| Option | Architecture | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Option A (Recommended)** | **Dedicated Route (`/dashboard`)** | Clean separation; allows a full-screen layout focused on data-entry, tables, and credentials; keeps `/` fast and consumer-centric. | Needs a navbar link and route config. |
| **Option B** | **Tabbed Layout on `/`** | Simple, quick setup, zero new routes. | Increases page code complexity; single-page bundle size grows; harder to build complex sub-views. |
| **Option C** | **Dynamic Contextual Page** | Automatically loads dashboard on `/` if wallet is a whitelisted QP, otherwise shows verification portal. | UX might be confusing for QPs wanting to perform public verifications; harder to test layout variations. |

> **Recommendation**: **Option A (Dedicated Route `/dashboard`)** for a professional and scalable structure. A button "QP Dashboard" will be added to the navbar, which redirects to `/dashboard`. If the connected user is not a QP, we show a gorgeous "Access Denied / Request Authorization" view rather than hiding the page.

---

## 4. Key Dashboard Features & Components

### 4.1 Whitelist Status Profile Card
A premium status card showing:
* **Active Address**: Displayed via Scaffold-ETH `<Address />`.
* **QP Status Badge**: A glowing indicator (e.g. pulsing green dot for whitelisted QPs, amber warning for connected non-QP addresses).
* **Technical Authority Summary**: Displays standard options (NI 43-101 / ECRR 2018) they are authorized to sign under.
* **Stats Counter**: Number of certificates signed by this QP.

### 4.2 Certificate Registration Form
A multi-step or clearly grouped form that utilizes Scaffold-ETH 2's custom inputs for safer data validation:
* **Standard Picker**: Interactive selector between *NI 43-101 (Canada)* and *ECRR 2018 (Colombia)*.
* **Category Selector**: Initial category selector (defaulting to `INFERRED`).
* **Cut-Off Grade (bps)**: Numerical input using `<IntegerInput />`.
* **Tonnage**: Numerical input using `<IntegerInput />` with metric unit suffix (e.g., "Tonnes").
* **GeoHash Input**: String validator for geohash coordinates.
* **Sign & Submit Button**: Glowing primary button with loading states.

### 4.3 Interactive Resource Escalator / Category Advance Panel
Since category advancement is restricted strictly to consecutive steps (INFERRED -> INDICATED -> MEASURED), the dashboard should feature a dedicated "Asset Manager" list:
* **My Assets List**: A sleek table of all certificates or certificates created by the connected QP.
* **Interactive Stepper**: Displays a timeline/stepper of the resource categories.
* **Advance Trigger**: Instead of typing the target category, the UI detects the current state and presents a single clear button (e.g., "Advance to INDICATED"). It disables automatically if the asset has reached the `MEASURED` state.

### 4.4 Admin Panel (Owner Only)
If the connected address matches the contract `owner()`, an **Admin Settings** section will appear allowing the owner to add new QPs to the whitelist using the `<AddressInput />` component and calling `whitelistQP(address)`.

---

## 5. Design System and Aesthetics

To deliver a premium, high-tech geological look, we will use a tailored **DaisyUI / Tailwind v4** theme:
* **Backgrounds**: Deep space obsidian and dark slate (`#1e293b` to `#0f172a`) with subtle glassmorphic backdrops (`backdrop-blur-md bg-white/5`).
* **Accents**: 
  * *Primary (Earthy Slate)*: `#385183`
  * *Success (Verified/Measured)*: `#34eeb6` (Teal/Emerald glow)
  * *Warning (Indicated)*: `#ffcf72` (Golden amber)
  * *Info/Inferred*: `#93bbfb` (Soft ice blue)
* **Glow & Border Animations**: Subtle gradients and box-shadow pulses for active inputs and validated status indicators.
* **Typography**: Clean, professional sans-serif fonts (e.g., Inter or Outfit) with bold geometric headings.

---

## 6. Recommended Next Steps (For Implementation)
1. Create `/dashboard` route directory: `packages/nextjs/app/dashboard/page.tsx`.
2. Add "QP Dashboard" link in `packages/nextjs/components/Header.tsx` (only display or enable it clearly).
3. Develop the Whitelist Profile Card and Admin Whitelist form.
4. Develop the Certificate Registration form with full client-side validation.
5. Create the "My Assets / Advance Category" panel showing current certifications and allowing one-click promotions.
