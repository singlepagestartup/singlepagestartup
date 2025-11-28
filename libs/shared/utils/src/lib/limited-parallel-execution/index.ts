export async function util<T>(
  tasks: (() => Promise<T | null>)[],
  concurrency: number,
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<any>[] = [];

  for (const task of tasks) {
    const promise = task().then((result) => {
      if (result !== null) {
        results.push(result);
      }
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);

      executing.splice(0, executing.length - concurrency);
    }
  }

  await Promise.all(executing);

  return results;
}
