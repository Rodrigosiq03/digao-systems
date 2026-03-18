# Portal Tailwind-First Styling Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Digao OAuth Portal styling so Tailwind is the primary styling mechanism for the admin shell and resource UI while preserving the current visual design.

**Architecture:** Keep `src/index.css` as global styling infrastructure only, then migrate shell/admin layout responsibilities into React components using Tailwind classes and small reusable presentation primitives. Verify the refactor through contract tests that guard both the CSS boundary and the existing admin UI structure.

**Tech Stack:** React, Vite, Tailwind CSS, Zustand, React Hook Form, Zod, Python unittest contract tests.

---

## File Structure

- Modify: `clients/web/digao-oauth-portal/src/index.css`
  - keep only global theme tokens, base reset, background, and global animation/effect rules
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/sidebar.tsx`
  - move collapsed shell styling into Tailwind class composition
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/topbar.tsx`
  - remove dependence on global shell classes
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/adminEditorSheet.tsx`
  - keep editor sheet styling local to component
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/quickActionsMenu.tsx`
  - move menu styling into Tailwind/component structure
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/userCards.tsx`
  - migrate resource card layout styling to Tailwind/component markup
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/systemCard.tsx`
  - same pattern for resource cards
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/AppShell.tsx`
  - shell layout classes become Tailwind-driven
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/UsersPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/SystemsPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/ProfilesPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/CapabilitiesPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/AssignmentsPage.tsx`
  - remove use of global admin layout helper classes
- Create/Modify: `clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py`
  - guard CSS boundary and component-driven shell styling
- Modify: existing portal contract tests as needed if they assert old class names

## Chunk 1: Guard the CSS Boundary

### Task 1: Add a failing contract test for forbidden admin-shell CSS in `index.css`

**Files:**
- Create: `clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py`
- Test: `clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py`

- [ ] **Step 1: Write the failing contract test**

Assert that `src/index.css` must not contain admin-shell classes such as:
- `.app-root`
- `.app-root-collapsed`
- `.app-sidebar-collapsed`
- `.quick-actions-menu`
- `.admin-page-grid`
- `.admin-page-stack`

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_tailwind_shell_contract -v`
Expected: FAIL because those selectors still live in `index.css`.

- [ ] **Step 3: Trim `src/index.css` to global-only responsibilities**

Keep only:
- Tailwind directives
- theme variables
- reset/base
- global background
- global landing animation/effect rules

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_tailwind_shell_contract -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add clients/web/digao-oauth-portal/src/index.css clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py
git commit -m "test(portal): enforce tailwind-first css boundary"
```

## Chunk 2: Move Shell and Admin Layout into Components

### Task 2: Add a failing contract test for component-owned shell layout

**Files:**
- Modify: `clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/AppShell.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/sidebar.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/topbar.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/adminEditorSheet.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/quickActionsMenu.tsx`

- [ ] **Step 1: Extend the contract test**

Assert that shell components now contain Tailwind-driven layout markers for:
- root flex/grid shell
- sidebar collapsed width behavior
- topbar wrapper
- editor sheet container
- quick actions menu panel

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_tailwind_shell_contract -v`
Expected: FAIL because components still rely on removed global classes.

- [ ] **Step 3: Implement minimal Tailwind-driven shell refactor**

Move shell/admin structure into component markup using Tailwind classes and conditional class composition.

- [ ] **Step 4: Run contract test and typecheck**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_tailwind_shell_contract -v`
Expected: PASS.

Run: `/home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn --cwd clients/web/digao-oauth-portal typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add clients/web/digao-oauth-portal/src/presentation/pages/AppShell.tsx clients/web/digao-oauth-portal/src/presentation/components/sidebar.tsx clients/web/digao-oauth-portal/src/presentation/components/topbar.tsx clients/web/digao-oauth-portal/src/presentation/components/adminEditorSheet.tsx clients/web/digao-oauth-portal/src/presentation/components/quickActionsMenu.tsx clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py
git commit -m "refactor(portal): move shell styling into tailwind components"
```

## Chunk 3: Move Resource Pages and Cards off Global Layout Helpers

### Task 3: Add a failing contract test for page/card layout ownership

**Files:**
- Modify: `clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/userCards.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/components/systemCard.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/UsersPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/SystemsPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/ProfilesPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/CapabilitiesPage.tsx`
- Modify: `clients/web/digao-oauth-portal/src/presentation/pages/AssignmentsPage.tsx`

- [ ] **Step 1: Extend the contract test**

Assert that resource pages/cards no longer depend on removed global helper classes like:
- `admin-page-grid`
- `admin-page-stack`
- `resource-card-*` style helpers if present

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_tailwind_shell_contract -v`
Expected: FAIL because those helpers are still referenced.

- [ ] **Step 3: Implement minimal Tailwind-driven page/card refactor**

Use Tailwind directly in pages/cards to preserve current structure and spacing.

- [ ] **Step 4: Run verification commands**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_tailwind_shell_contract -v`
Expected: PASS.

Run: `/home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn --cwd clients/web/digao-oauth-portal typecheck`
Expected: PASS.

Run: `/home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn --cwd clients/web/digao-oauth-portal build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add clients/web/digao-oauth-portal/src/presentation/components/userCards.tsx clients/web/digao-oauth-portal/src/presentation/components/systemCard.tsx clients/web/digao-oauth-portal/src/presentation/pages/UsersPage.tsx clients/web/digao-oauth-portal/src/presentation/pages/SystemsPage.tsx clients/web/digao-oauth-portal/src/presentation/pages/ProfilesPage.tsx clients/web/digao-oauth-portal/src/presentation/pages/CapabilitiesPage.tsx clients/web/digao-oauth-portal/src/presentation/pages/AssignmentsPage.tsx clients/web/digao-oauth-portal/tests/test_tailwind_shell_contract.py
git commit -m "refactor(portal): move admin resource styling into tailwind"
```

## Chunk 4: Final Verification

### Task 4: Run full portal verification for the refactor

**Files:**
- Verify: `clients/web/digao-oauth-portal/tests/`
- Verify: `clients/web/digao-oauth-portal/src/`

- [ ] **Step 1: Run portal contract tests**

Run: `python3 -m unittest clients.web.digao-oauth-portal.tests.test_admin_shell_contract clients.web.digao-oauth-portal.tests.test_authorization_api_contract clients.web.digao-oauth-portal.tests.test_authorization_mutations_contract clients.web.digao-oauth-portal.tests.test_authorization_navigation_contract clients.web.digao-oauth-portal.tests.test_authorization_pages_contract clients.web.digao-oauth-portal.tests.test_vpn_access_contract clients.web.digao-oauth-portal.tests.test_tailwind_shell_contract -v`
Expected: PASS.

- [ ] **Step 2: Run frontend verification**

Run: `/home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn --cwd clients/web/digao-oauth-portal typecheck`
Expected: PASS.

Run: `/home/rodrigo/.nvm/versions/node/v24.13.0/bin/corepack yarn --cwd clients/web/digao-oauth-portal build`
Expected: PASS.

Run: `git diff --check`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add clients/web/digao-oauth-portal
git commit -m "refactor(portal): adopt tailwind-first styling boundaries"
```
