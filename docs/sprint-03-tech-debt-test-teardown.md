# Technical Debt: Refine Jest Setup/Teardown for Property Module

**Date:** February 21, 2026
**Module:** `property` (Sprint 03)
**Status:** Open
**Priority:** Medium

## Context
During the Sprint 03 (Property Marketplace) audit, the test suite for the `property` module successfully passed all 198 unit tests. However, the test execution revealed underlying issues with the test environment's lifecycle management.

## Symptoms
1. **Connection Errors in Logs:** The console outputs `[PrismaService] Database health check failed` and `[RedisService] Redis health check failed` during test execution.
2. **Hanging Workers:** Jest warns about worker processes failing to exit gracefully, often requiring `--forceExit` to terminate the test run.
3. **Skewed Coverage Reporting:** Despite 198 tests passing and covering the business logic, the coverage metrics report 0% for many files in the `property` module. This is a direct side-effect of the teardown failures interrupting the coverage collection phase.

## Root Cause Hypothesis
- **Unclosed Connections:** The NestJS testing modules (`Test.createTestingModule`) are likely not being properly closed in the `afterAll` hooks. If `app.close()` or `module.close()` is not called, the `onModuleDestroy` lifecycle hooks for `PrismaService` and `RedisService` do not execute, leaving active connections.
- **Background Intervals:** Health checks or other background intervals in `PrismaService` or `RedisService` might be continuing to run after the tests finish.
- **Improper Mocking:** The tests might be importing the real `DatabaseModule` or `CacheModule` without properly overriding them with mocks, causing them to attempt real connections during unit tests.

## Action Items
- [ ] **Audit Test Files:** Review all `*.spec.ts` files within `apps/api/src/property/`.
- [ ] **Implement Teardown Hooks:** Ensure every test suite has an `afterAll` hook that properly closes the testing module (e.g., `await module.close()`).
- [ ] **Review Module Imports:** Check the `Test.createTestingModule` setups to ensure that external dependencies (Prisma, Redis) are properly mocked and not initiating real connections unless intended (e.g., in E2E tests).
- [ ] **Disable Background Tasks:** Ensure that any background health checks are disabled or mocked out when `NODE_ENV=test`.
- [ ] **Verify Clean Exit:** Run `npm run test --workspace=apps/api -- property` and verify that it exits cleanly and immediately without needing `--forceExit`.
- [ ] **Verify Coverage:** Run the tests with coverage enabled and confirm that the coverage metrics accurately reflect the tested code.

## Acceptance Criteria
- Running `npm run test` for the property module produces no database or Redis connection errors in the console.
- Jest exits gracefully without warnings about open handles or hanging workers.
- Coverage reports accurately reflect the code paths executed by the 198 passing tests.