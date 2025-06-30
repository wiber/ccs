# ADR-002: SQLite Over PostgreSQL

## Status
Accepted

## Context
CCS needs a fast, reliable database for storing operation history, learning patterns, and context data. We evaluated PostgreSQL, SQLite, and several NoSQL options.

## Decision
We chose SQLite with the following configuration:
- WAL mode for better concurrency
- FTS5 extension for full-text search
- Custom VFS for improved I/O patterns
- In-memory databases for temporary data

## Consequences

### Positive
- Zero configuration required
- Exceptional read performance (<1ms queries)
- Portable across all platforms
- Built-in full-text search

### Negative
- Limited concurrent writes
- No network access capabilities
- Manual backup strategies needed
- Missing some advanced PostgreSQL features

## Performance Comparison
[THIS SECTION NEEDS COMPLETION]

Our benchmarks show:
- Simple queries: SQLite ??? ms, PostgreSQL ??? ms
- Full-text search: SQLite ??? ms, PostgreSQL ??? ms
- Concurrent writes: SQLite ??? ops/sec, PostgreSQL ??? ops/sec
- Memory usage: SQLite ??? MB, PostgreSQL ??? MB

## Migration Path
If we need to migrate to PostgreSQL in the future:
1. ???
2. ???
3. ???

## Open Questions
- How do we handle database migrations in a distributed npm package?
- Should we support PostgreSQL as an optional backend?
- What's the optimal page size for our access patterns?