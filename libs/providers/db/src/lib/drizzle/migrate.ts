import { MigrationConfig } from "drizzle-orm/migrator";
import { migrate as drizzleMigrator } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { cwd } from "process";
import { db } from "./index";

/**
 * Error while trying to migrate
 * Thats because validateWithReport function in drizzle kit
 * add "./" before the path
 * const raw2 = JSON.parse((0, import_fs8.readFileSync)(`./${it}`).toString());
 * Reading config file '/Users/rogwild/code/singlepagestartup/singlepagestartup/apps/frontend/src/db/config.ts'
🚀 ~ meta: /Users/rogwild/code/singlepagestartup/singlepagestartup/apps/frontend/src/db/migrations/meta
🚀 ~ snapshots: [
  '/Users/rogwild/code/singlepagestartup/singlepagestartup/apps/frontend/src/db/migrations/meta/0000_snapshot.json'
]
Error: ENOENT: no such file or directory, open './/Users/rogwild/code/singlepagestartup/singlepagestartup/apps/frontend/src/db/migrations/meta/0000_snapshot.json'
    at Object.openSync (node:fs:580:18)
    at readFileSync (node:fs:459:35)
    at snapshots.reduce.malformed (/Users/rogwild/code/singlepagestartup/singlepagestartup/node_modules/drizzle-kit/bin.cjs:18910:63)
    at Array.reduce (<anonymous>)
    at validateWithReport (/Users/rogwild/code/singlepagestartup/singlepagestartup/node_modules/drizzle-kit/bin.cjs:18908:32)
    at prepareMigrationFolder (/Users/rogwild/code/singlepagestartup/singlepagestartup/node_modules/drizzle-kit/bin.cjs:18951:22)
    at prepareAndMigratePg (/Users/rogwild/code/singlepagestartup/singlepagestartup/node_modules/drizzle-kit/bin.cjs:14967:40)
    at Command.<anonymous> (/Users/rogwild/code/singlepagestartup/singlepagestartup/node_modules/drizzle-kit/bin.cjs:66033:9) {
  errno: -2,
  code: 'ENOENT',
  syscall: 'open',
  path: './/Users/rogwild/code/singlepagestartup/singlepagestartup/apps/frontend/src/db/migrations/meta/0000_snapshot.json'
}
 */

export const migrate = async (props?: MigrationConfig) => {
  try {
    const { migrationsFolder = path.resolve(cwd(), "./src/db/migrations") } =
      props || {};

    await drizzleMigrator(db, { ...(props || {}), migrationsFolder });

    console.log("Migration successful");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
