# Admin Panel Specification

## Purpose

Provides the contract owner with an administrative interface on the `/dashboard` route to authorize new Qualified Persons (QPs) by whitelisting their addresses.

## Requirements

### Requirement: Admin Settings Access

The Admin Settings Panel MUST only be visible and accessible if the connected wallet address is the contract `owner()`.
- The contract owner address MUST be retrieved using `useScaffoldReadContract` querying the `owner` function.
- If the connected wallet address matches the owner address, the Admin Settings Panel MUST be rendered.
- If the connected wallet address does not match the owner address, the Admin Settings Panel MUST NOT be rendered.

#### Scenario: Owner Connects Wallet
- GIVEN the contract owner wallet is connected
- WHEN the user navigates to `/dashboard`
- THEN the system MUST render the Admin Settings Panel

#### Scenario: Non-Owner Connects Wallet
- GIVEN a wallet that is not the contract owner is connected
- WHEN the user navigates to `/dashboard`
- THEN the system MUST NOT render the Admin Settings Panel

---

### Requirement: Whitelist Form

The Whitelist Form MUST allow the owner to authorize new QPs using safe input components.
- The form MUST use the Scaffold-ETH 2 `<AddressInput />` component to capture the target QP address.
- The form MUST require selecting the mining standard to authorize (e.g., NI 43-101 or ECRR 2018).
- Clicking the authorize button MUST invoke `whitelistQP` via the `useScaffoldWriteContract` hook, passing the target address and authorized standard.
- The submit button MUST be disabled if the input address is invalid or if a transaction is pending (`isMining` is true).

#### Scenario: Owner Successfully Whitelists a QP
- GIVEN the contract owner is connected to `/dashboard`
- AND a valid target address is entered in the `<AddressInput />` component
- WHEN the owner submits the form
- THEN the system MUST invoke `whitelistQP` with the target address and standard
- AND clear the input field after successful transaction confirmation
