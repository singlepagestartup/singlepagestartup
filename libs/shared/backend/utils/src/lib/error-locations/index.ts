// Persist locations instead of complete error strings. A driver error, a
// validator or the first line of a stack may echo SQL parameters or form data.
function frames(error: Error) {
  const stack = error.stack ?? "";
  const messageOffset = stack.indexOf(error.message);
  let start = stack.indexOf("\n") + 1;
  if (error.message && messageOffset >= 0) {
    start = messageOffset + error.message.length;
  }
  const result: string[] = [];
  for (const line of stack.slice(start, start + 32768).split("\n")) {
    if (!/^\s*at /.test(line)) {
      continue;
    }
    const location = line.match(
      /(?:^|[/( ])((?:libs|apps|node_modules|dist)\/[\w@./-]+\.[cm]?[jt]sx?:\d+:\d+)\)?$/,
    );
    if (location) {
      result.push(location[1].slice(-240));
    } else {
      const file = line.match(/(?:^|[/( ])([\w.-]+\.[cm]?[jt]sx?:\d+:\d+)\)?$/);
      if (file) {
        result.push(file[1].slice(-120));
      }
    }
    if (result.length >= 8) {
      break;
    }
  }
  return result;
}

export function failureLocations(error: Error) {
  const locations: { frames: string[]; code?: string }[] = [];
  let current: unknown = error;
  while (current instanceof Error && locations.length < 4) {
    const code = (current as NodeJS.ErrnoException).code;
    const record: { frames: string[]; code?: string } = {
      frames: frames(current),
    };
    if (
      typeof code === "string" &&
      /^(?:23505|23503|23502|23514|40001|40P01|42P01|42703|53300|57P01|ECONNRESET|ETIMEDOUT|ECONNREFUSED|ENOENT|EACCES|ENOSPC)$/.test(
        code,
      )
    ) {
      record.code = code;
    }
    locations.push(record);
    current = current.cause;
  }
  return locations;
}
