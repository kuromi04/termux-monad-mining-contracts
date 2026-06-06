# Public Home Specification

## Purpose

Provides a public-facing portal for querying and verifying mining certificates, removing any write operations or dashboard forms from the main homepage.

## Requirements

### Requirement: Public Lookup Interface

The home page (`/`) MUST only expose query and verification capabilities.
- The home page MUST NOT contain any form fields or sections for registering new certificates.
- The home page MUST NOT contain buttons or options for advancing resource categories.
- The home page MUST display a verification card allowing users to lookup certificates by Token ID.
- The lookup MUST fetch certificate details from the blockchain using the `useScaffoldReadContract` hook for `getCertificate`.
- If a valid certificate is returned, the page MUST display the certificate details (Title ID, Standard, Category Badge, Cut-off grade, Tonnage, and QP address).
- The QP address MUST be displayed using the Scaffold-ETH 2 `<Address />` component.

#### Scenario: Lookup Valid Certificate
- GIVEN a valid certificate exists in the contract with Token ID `1`
- WHEN the user enters `1` in the Token ID search field
- THEN the system MUST query the contract and display the certificate details
- AND the signing QP address MUST be rendered using the `<Address />` component

#### Scenario: Write Forms Absent from Homepage
- GIVEN a user accesses the home page (`/`)
- WHEN the page is rendered
- THEN the system MUST NOT display the Certificate Registration form
- AND the system MUST NOT display the "Avanzar a next category" button or escalator controls
