# Readable backend control flow

Write backend handlers, services, middleware and their tests so a reviewer can
follow what runs, when it stops and which errors it returns.

- Use a loop that states what remains to process. Iterate collections with
  `for...of`, read streams with `while (!chunk.done)`, and use `do...while`
  when the first attempt must run before the next one can be decided. Never
  write `for (;;)`. For a genuinely unbounded worker use `while (true)` and
  make its cancellation or exit path explicit.
- Give every `if`, `else` and loop body braces. Put each return, throw, break,
  mutation and awaited operation on its own line, including in early exits.
- Reserve ternary expressions for a simple choice between two values. Use
  named intermediate values or explicit branches for nested choices,
  side effects, validation and asynchronous operations.
- Complete asynchronous work before constructing a response. Assign awaited
  service and SDK results to named variables, then pass those values to
  `c.json`, `Response`, MCP response helpers or returned objects. Keep
  conditional work inside its branch, preserve existing `Promise.all`
  concurrency, and keep awaits inside the same error and transaction scopes.
- When reviewing a loop change, check empty input, the last item or chunk,
  early errors and resource cleanup. Preserve the order of side effects.
