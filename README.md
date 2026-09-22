# Facility-specific code in the core application

## The problem

Currently, `user-office-core` is a shared application. It contains the common User Office functionality that should be usable by every facility, but it also contains code written specifically for individual facilities.

This makes the core application responsible for two different concerns:

1. Providing shared User Office functionality.
2. Containing and maintaining the private operational integrations of each facility.

These concerns have become mixed together throughout the application. The facility-specific code is not isolated behind one clear boundary. It is spread through configuration, authentication, datasources, email handlers, spreadsheet exports, feature flags, tests, deployment scripts, and documentation.

That structure is difficult to maintain as more facilities join the collaboration. Each new integration adds another set of files, configuration branches, imports, tests, environment variables, and deployment assumptions to the shared repository.

## Evidence in the current codebase

### Facility-specific configuration

The backend contains separate configuration implementations for each facility.

- `apps/backend/src/config/dependencyConfigXXX.ts`
- `apps/backend/src/config/xxx/`

The application also selects between these configurations using the `DEPENDENCY_CONFIG` environment variable. This means the shared application has to know about the set of facilities that exist and the names of their configurations.

### Facility-specific authentication, datasources and event handlers.

Further to the configuration, the core backend contains facility-specific implementations such as:

- `apps/backend/src/auth/XXXUserAuthorization.ts`
- `apps/backend/src/datasources/stfc/`
- `apps/backend/src/eventHandlers/email/XXXEmailHandler.ts`

### Further facility-specific coupling

`apps/backend/src/factory/xlsx/callFaps.ts` contains facility specific code, even though it is a core part of the application. The code in this file further relies on the following STFC files to make the core build pass, even though the other facility integrations do not use them:

- `apps/backend/src/factory/xlsx/stfc/StfcFapDataRow.ts`
- `apps/backend/src/datasources/stfc/StfcUserDataSource.ts`
- `apps/backend/src/datasources/stfc/UOWSClient.ts`

This is a clear example of facility-specific code being structurally tied to a core file.

### Facility-specific tests, deployment, and documentation

Further references remain in:

- STFC-specific E2E tests and Cypress fixtures.
- STFC Docker Compose files and package scripts.
- STFC-specific OpenAPI examples.
- ESS, ELI, and STFC seed data and database migrations.
- facility-specific logos and documentation.
- Build and deployment workflow steps that trigger facility-specific deployment systems.

## Problems caused by this structure

### 1. The core repository has unclear ownership

The core repository contains code owned by multiple facilities. It becomes unclear who is responsible for reviewing, testing, maintaining, and approving changes to a given part of the application.

A facility may need to modify its own integration, but that change is mixed into the shared repository and follows the shared repository's review and release process.

### 2. Private integration details are placed in the shared codebase

Even when secrets are kept out of Git, source code can reveal details about:

- External services and API contracts.
- Authentication flows.
- Facility-specific roles and permissions.
- Facility processes and terminology.

Keeping these details in the shared repository makes access control less clear and increases the chance that private integration knowledge is distributed more broadly than intended.

### 3. Core code is coupled to integrations it does not use

The `callFaps.ts` example shows that a core feature can depend directly on an facility-specific implementation. Removing the implementation causes a core build failure, even for deployments that do not use that facility's functionality.

This coupling makes it difficult to run a genuinely facility-neutral version of the application.

### 4. Configuration becomes a growing collection of special cases

The application has to know about configuration names such as `eli`, `ess`, `dls` and `stfc`, as well as their files and loading rules. Each new facility adds another special case to the configuration model.

The result is a configuration system that grows with the number of facilities rather than with the shared application capabilities.

### 5. The build and test process becomes unnecessarily broad

Having the core project tested against mock data once would speed up the time the tests take to run. Currently, the whole test suite appears to be running twice because of facility specific tests being run. 

### 7. Deployment logic is mixed with application logic

The shared repository contains workflow steps that trigger different external deployment systems and facility-specific E2E environments.

This makes it difficult to answer which parts of a build are required for the core application and which parts exist only for a particular facility.

### 8. Releases are harder to version independently

A facility-specific fix is tied to the core repository's branch and release process. It cannot be released independently without also moving the shared repository through its release workflow.

Conversely, a core release may include changes to integrations that are not relevant to the facility deploying it.

### 9. Adding another facility increases the problem

Each of these issues are made potentially more troublesome as more facilities are added.

## Proposed approach

Facility-specific integrations should be moved into separate facility-owned repositories. The shared `user-office-core` repository would remain focused on common application functionality.

The facility repository would include `user-office-core` as a Git submodule and would contain the facility-specific source, tests, configuration, and build workflow alongside it. The facility repository would pin the core submodule to the exact core commit that it has been tested against.

The core application would load an external dependency configuration when the `DEPENDENCY_CONFIG` environment variable contains a file path. The core would only need to understand its own default and test configurations and the concept of loading an external configuration. It would not need to know the names or locations of individual facility integrations.

Facility code would use a stable `@core` alias when importing shared code and relative imports for code within the facility repository. The core repository would not contain a facility-specific alias or imports into a facility repository.

## Why not use `package.json`?

The core application could be included as a stand alone package and brought in to the facility-specific implementation via the `dependencies` property of the `package.json` file, however, this would degrade developer experience since, often, changes need to be made to both the core and facility code.

Using a git submodule means all code is available in a single editor/IDE and changes can be committed to each repository individually.

## How this addresses the problems

### 1. Core repository ownership

Facility-specific code would be owned and reviewed in the relevant facility repository. The core repository would contain shared functionality and shared interfaces, while each facility repository would contain its own operational implementation.

This gives each change a clearer owner and allows a facility to manage its own integration without adding unrelated implementation details to the shared core review process.

### 2. Private integration details in the shared codebase

Facility-specific source code can be kept in a private facility repository, separate from the shared core repository. Secrets would still be supplied by the deployment environment rather than committed to either repository.

This separates access to shared application code from access to facility integration details. It does not make code private automatically; the access level of each facility repository still needs to be chosen deliberately.

### 3. Core coupling to unused integrations

The external dependency configuration creates a boundary in which the core loads the selected facility implementation without importing it directly. Deployments that use the default configuration would not need to contain or compile facility-specific configuration code.

This would eliminate coupling such as a core configuration importing a facility authorization class or email handler.

The current `callFaps.ts` example shows that this problem is not fully solved yet. The core file still imports STFC spreadsheet code, which is why the STFC files are still present in this POC. That dependency would need to be refactored behind a generic core interface or moved into the relevant facility integration before this issue is fully eliminated.

### 4. Growing configuration special cases

The core configuration loader would only distinguish between built-in configurations such as `default` and `test`, and an externally supplied file path. It would not contain cases for `eli`, `ess`, `dls`, `stfc`, or future facility names.

### 5. Broad build and test process

Facility tests could run in the facility repository, while the core repository would run only shared core tests. A facility CI workflow could run the core checks together with its own integration tests when validating a deployment.

This avoids putting every facility's tests into the standard core test run and avoids running facility-specific tests as part of unrelated core changes.

The core still needs a reliable generic test suite, and a facility repository would still need to test the combination of its pinned core version and its integration. The benefit is that these checks are separated according to ownership and deployment relevance.

### 7. Deployment logic mixed with application logic

Build and deployment workflows could live in the facility repository. The facility workflow would know how to build the combined facility image, select the external configuration, publish the image, and trigger the facility's deployment system.

The core workflow would build and test only the facility-neutral core images. This makes it clearer which deployment steps belong to the shared application and which belong to a particular facility.

### 8. Independent release versioning

The facility repository can release an integration change by updating its own commit while retaining the same core submodule commit. A core update can be tested and adopted by updating the submodule pointer in the facility repository.

The combination of:

- the facility repository commit; and
- the core submodule commit

provides a reproducible version pair for a deployment.

Changes that affect both repositories still require coordination, but the dependency is explicit rather than being hidden inside one shared branch.

## Remaining trade-offs

This approach does not remove all complexity. It introduces a multi-repository workflow, submodule management, cross-repository pull requests, and the need to define stable core interfaces.

It also requires the build system to compile and package the core and facility source together. The facility repository must ensure that the selected core commit, dependency configuration, generated code, runtime dependencies, and deployment configuration are all compatible.

The main benefit is that this complexity reflects a real boundary between the shared application and facility-owned integrations, rather than hiding that boundary inside one increasingly complex repository.

## POC implementation and build workflow

This repository contains a minimal workflow demonstrating how the combined application can be built without adding facility-specific build logic to `user-office-core`.

The workflow:

1. Checks out the facility integration repository.
2. Initialises the public `user-office-core` Git submodule.
3. Installs the core workspace dependencies.
4. Generates the frontend SDK using the core application tooling.
5. Builds a backend image using a facility-owned Dockerfile.
6. Builds the frontend image from the core submodule.
7. Publishes the images to the facility image repository.

This demonstrates that the integration repository can own the build entrypoint and include the core repository as a dependency. The core repository does not need to contain a reference to the facility repository or a facility-specific workflow.

The current image build is intentionally minimal and still has limitations.