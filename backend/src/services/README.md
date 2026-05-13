Service layer for database and domain operations.

Current implementation still uses the local MySQL/local-store adapters in `src/lib`.
When Prisma is introduced, Prisma client calls should live here instead of inside route handlers.
