# Organisation-specific integration extraction POC

## Purpose

This document describes a proof of concept for separating organisation-specific
code from `user-office-core`.

The POC uses Diamond Light Source (DLS) as the example integration. The DLS
code is held in a separate repository and the core repository is included as a
Git submodule:

```text
dls-integration/
├── src/                         # DLS-specific code
├── tsconfig.json
├── jest.config.js
└── user-office-core/            # pinned core repository submodule
    └── apps/backend/
```

The DLS repository currently contains the core repository as a submodule. The
submodule is pinned to a specific core branch and commit, so each integration
repository can select the core version it has been tested against.

## How the POC works

The core application loads its dependency configuration using the
`DEPENDENCY_CONFIG` environment variable.

The variable can select a built-in configuration such as `test` or `default`,
or point to an external configuration file. For the DLS checkout it points to:

```env
DEPENDENCY_CONFIG=../../../src/config/dependencyConfig
```

This path is relative to `user-office-core/apps/backend`, which is the process
working directory when the backend is started.

The external DLS configuration imports core functionality through the `@core`
alias. DLS files import one another using relative imports. The core project
does not need an `@dls` alias or any DLS-specific path mapping.

The DLS repository has its own TypeScript and Jest configuration. It extends or
maps to the core source tree and includes the DLS source tree when compiling or
running tests.

## Development workflow

Install dependencies in both repositories:

```bash
cd dls-integration
npm install

cd user-office-core/apps/backend
npm install
```

Run the DLS integration tests from the DLS repository:

```bash
cd dls-integration
npm test -- --runInBand
```

Run the combined backend from the submodule:

```bash
cd dls-integration/user-office-core/apps/backend
npm run dev
```

The backend loads the `.env` file in the submodule and then loads the external
DLS dependency configuration.

## Benefits

### Clearer ownership

Organisation-specific implementations can be maintained by the organisation
that owns them. The core repository contains shared functionality and does not
need to contain every organisation's private integration code.

### Independent access control

The integration repository can be private while the core repository remains
available to the wider collaboration. This is useful where integration code,
configuration, endpoints, or operational details should not be broadly
available.

### A pinned, reproducible combination

The integration repository records the exact core commit it uses. A deployment
can therefore be reproduced from the integration repository without relying on
whatever happens to be at the tip of the core branch.

### Smaller organisation-specific changes in core

New DLS functionality can normally be added to the DLS repository without
adding DLS files to the core repository. Shared core changes can still be made
in the core repository when the integration genuinely requires them.

### Incremental migration

The dependency configuration boundary allows integrations to be moved out one
area at a time. The entire application does not need to be redesigned before
the first integration can be extracted.

## Costs and risks

### Two-repository development

Developers must understand the relationship between the integration repository
and the core submodule. A change that spans both repositories requires commits
in both repositories and an update of the submodule pointer.

### Submodule workflow overhead

A normal clone needs submodule initialisation. Updating the core version is an
explicit operation, and it is possible for a developer to modify the core
submodule without committing or updating the parent repository's pointer.

### Build and editor configuration

The TypeScript compiler, Jest, and runtime module resolver must all understand
the combined source tree. Incorrect working directories or configuration paths
can result in imports working in one context but not another.

### Cross-repository changes are less atomic

There is no single commit containing a change to both repositories. The core
change must be pushed first, after which the integration repository can update
its submodule pointer. Until both changes are available, another developer or
CI system cannot reproduce the complete change.

### Deployment becomes an explicit concern

The deployment process must check out the integration repository and initialise
its core submodule. It must also install dependencies from the correct root and
pass the correct external configuration path.

### Runtime coupling still exists

Moving files does not remove coupling. The DLS configuration still depends on
core interfaces, tokens, datasources, models, and event types. These interfaces
need to be kept stable or changed in a coordinated way.

### Possible duplication of dependencies

The core and integration repositories may each have their own `node_modules`.
This can increase installation time and can cause issues when libraries that
hold global state, such as dependency-injection containers, are loaded twice.

## Organisation-specific code still in core

The extraction is incomplete. The following organisation-specific areas remain
in `user-office-core`.

### ELI, ESS, and STFC configuration

These are still present in the backend configuration tree:

- `apps/backend/src/config/dependencyConfigELI.ts`
- `apps/backend/src/config/dependencyConfigESS.ts`
- `apps/backend/src/config/dependencyConfigSTFC.ts`
- `apps/backend/src/config/eli/`
- `apps/backend/src/config/ess/`
- `apps/backend/src/config/stfc/`

The example environment file also still documents organisation-specific
configuration names:

```text
apps/backend/example.development.env
```

### Authorisation and datasource implementations

The following organisation-specific implementations remain in core:

- `apps/backend/src/auth/ELIUserAuthorization.ts`
- `apps/backend/src/auth/StfcUserAuthorization.ts`
- `apps/backend/src/auth/StfcProposalAuthorization.ts`
- `apps/backend/src/datasources/stfc/`

### Organisation-specific email handlers

These remain in:

- `apps/backend/src/eventHandlers/email/eliEmailHandler.ts`
- `apps/backend/src/eventHandlers/email/essEmailHandler.ts`
- `apps/backend/src/eventHandlers/email/stfcEmailHandler.ts`

Their associated tests remain with them.

### STFC spreadsheet export coupling

`apps/backend/src/factory/xlsx/callFaps.ts` is a core file but still imports
STFC-specific spreadsheet code:

```ts
import { callFapStfcPopulateRow } from './stfc/StfcFapDataRow';
```

To keep the core build working, the following STFC files are currently present:

- `apps/backend/src/factory/xlsx/stfc/StfcFapDataRow.ts`
- `apps/backend/src/datasources/stfc/StfcUserDataSource.ts`
- `apps/backend/src/datasources/stfc/UOWSClient.ts`

This is an important example of residual coupling. Although DLS does not use
the STFC implementation, the core `callFaps.ts` type and import structure still
requires it to exist at build time.

### STFC feature flag coupling

`STFC_IDLE_TIMER` remains part of the shared feature model and is referenced by
backend and frontend code. It is also referenced by the extracted DLS
environment configuration. This should eventually be replaced with a generic
feature or moved behind an integration-specific capability.

### E2E, migration, seed, and documentation references

Additional references remain in:

- STFC-specific Docker Compose and package scripts
- Cypress fixtures and E2E tests
- Database migrations and seed data containing ESS, ELI, or STFC values
- OpenAPI examples and test email addresses
- Organisation logos and documentation

Some database migration references are historical and should probably remain
immutable. They should be distinguished from active runtime integration code
before being removed.

## Current POC assessment

The POC demonstrates that:

- DLS dependency configuration can be loaded from outside the core source
  tree.
- DLS-specific handlers and spreadsheet code can be maintained in a separate
  repository.
- The core source can be referenced through a single `@core` alias.
- DLS-internal imports can remain relative, avoiding a core-owned `@dls` alias.
- The extracted DLS tests can run independently.
- The core backend TypeScript build can pass while retaining the minimum STFC
  files currently required by `callFaps.ts`.

The POC does not yet establish a production deployment process, versioning
policy, or a final boundary for shared interfaces.

## Deployment — next stage

The next stage of this investigation is to define how an integration repository
is built and deployed. This should cover:

- How CI checks out private integration repositories and submodules.
- Which repository owns the Docker build context and Dockerfile.
- Where `npm install` runs and how dependencies are cached.
- How the external dependency configuration path is supplied.
- How secrets and environment-specific configuration are injected.
- How core and integration commits are versioned and promoted together.
- How database migrations are selected and run.
- How non-DLS deployments continue to use the core repository alone.
- How a deployment can be rolled back to a known core/integration pair.

