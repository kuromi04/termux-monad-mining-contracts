# Design: QP Dashboard

## Technical Approach

We will implement a role-based dashboard at `/dashboard` separating Qualified Person (QP) actions from the public lookup page. The navbar will be updated to link to `/dashboard`, and the home page `/` will be simplified to a read-only lookup view. 

Contract interactions will use Scaffold-ETH 2 hooks (`useScaffoldReadContract`, `useScaffoldWriteContract`) and components (`Address`, `AddressInput`).

## Architecture Decisions

| Decision Title | Options Considered | Tradeoffs | Selected Decision & Rationale |
| :--- | :--- | :--- | :--- |
| **Role-based Access Control** | 1. Client-side hooks.<br>2. Next.js Middleware. | 1. Fast loading, aligns with Scaffold-ETH design, works offline.<br>2. Harder to retrieve Web3 wallet status on server side. | **Option 1**: Perform client-side checks for `whitelistedQP(connectedAddress)` and `owner()`. Shows immediate "Access Denied" or specific cards. |
| **QP Asset Querying Loop** | 1. Iterate client-side `1` to `nextTokenId`.<br>2. External Indexer (Subgraph). | 1. Zero extra infra, works out-of-the-box; may scale poorly on large counts.<br>2. High scalability; requires setting up indexer infra. | **Option 1**: Read `nextTokenId` and call `getCertificate` in an async client loop using the contract instance. Acceptable for dev/testnet phase. |
| **Standard in Whitelist Form** | 1. Select standard in UI only.<br>2. Modify contract to map standard to QP. | 1. Keeps contract simple, standard selected per certificate.<br>2. Requires redeploying contract and increased state storage. | **Option 1**: Contract `whitelistQP` only takes an address. The UI standard selector will exist for compliance but standard is enforced at registration. |

## Data Flow

```
[User Wallet] ──(Connect)──→ [Header Navbar]
     │
     ├──(QP Address)───────→ [Whitelist Status Card] ──(read: whitelistedQP)──→ [MiningRegistry]
     │
     ├──(Register inputs)──→ [Registration Form] ──(write: registerCertificate)─→ [MiningRegistry]
     │
     ├──(Escalate click)───→ [Resource Escalator] ──(write: advanceCategory)──→ [MiningRegistry]
     │
     └──(Whitelist inputs)─→ [Admin Panel (Owner)] ──(write: whitelistQP)────→ [MiningRegistry]
```

## File Changes

| File | Action | Description |
| :--- | :--- | :--- |
| `packages/nextjs/app/dashboard/page.tsx` | Create | Implements role-based dashboard. Includes Whitelist Card, Registration Form, Asset Escalator, and Owner Admin Panel. |
| `packages/nextjs/components/Header.tsx` | Modify | Update `menuLinks` to add `/dashboard` route. |
| `packages/nextjs/app/page.tsx` | Modify | Simplify homepage to read-only certificate verification. Remove write/escalator forms. |

## Interfaces / Contracts

We read and write from `MiningRegistry` using the following signatures:

```solidity
// Reads
function whitelistedQP(address) external view returns (bool);
function owner() external view returns (address);
function nextTokenId() external view returns (uint256);
function getCertificate(uint256 tokenId) external view returns (MiningAssetCertificate memory);

// Writes
function whitelistQP(address qp) external;
function registerCertificate(string titleId, uint8 standard, uint8 category, uint256 cutOffGradeBps, uint256 tonnage, string polygonGeoHash) external returns (uint256);
function advanceCategory(uint256 tokenId, uint8 newCategory) external;
```

## Testing Strategy

| Layer | What to Test | Approach |
| :--- | :--- | :--- |
| Client | UI access controls & validations | Connect non-QP, QP, and owner accounts to check conditional panel rendering. Validate form validation limits (e.g., tonnage > 0). |
| Integration | Blockchain state updates | Execute `registerCertificate` and `advanceCategory` using QP account on local chain or Monad Testnet and verify successful updates. |

## Migration / Rollout

No contract migration is required. The smart contracts are already deployed. Changes only affect the Next.js frontend, which will be updated and deployed concurrently.

## Open Questions

- None.
