export function util({
  segments,
}: {
  segments: Array<string | string[]>;
}): string[][] {
  let paths: string[][] = [[]];

  for (const segment of segments) {
    if (Array.isArray(segment)) {
      const newPaths: string[][] = [];
      for (const path of paths) {
        for (const subSegment of segment) {
          newPaths.push([...path, subSegment]);
        }
      }
      paths = newPaths;
    } else {
      paths = paths.map((path) => [...path, segment]);
    }
  }

  return paths;
}
