# Navigation Specification

## Purpose

Manages the global application header and navigation menus, providing links to access different sections of the application.

## Requirements

### Requirement: Navigation Links

The application navigation menu (`Header.tsx`) MUST include links to the home page, debug interface, and the QP dashboard.
- The link for "Home" MUST point to `/`.
- The link for "Debug Contracts" MUST point to `/debug`.
- The link for "QP Dashboard" MUST point to `/dashboard`.
- These links MUST be rendered in both the desktop header navbar and the mobile menu dropdown.
- The active link representing the current page route MUST be highlighted using the active styling classes (`bg-secondary shadow-md`).

#### Scenario: Navigation Links Rendered in Header
- GIVEN the application is loaded
- WHEN the header menu is rendered
- THEN the system MUST display the "Home", "Debug Contracts", and "QP Dashboard" links
- AND the "QP Dashboard" link MUST point to `/dashboard`

#### Scenario: Highlighting Active Route
- GIVEN the user is on the `/dashboard` route
- WHEN the header menu is rendered
- THEN the system MUST style the "QP Dashboard" link as active
- AND the "Home" and "Debug Contracts" links MUST NOT be styled as active
