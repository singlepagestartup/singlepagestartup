Closes #318.

## What changes

The API previously used the PostgreSQL image's administrator login. A nightly backup could also leave customer data readable by other host users, and its documented restore executed dump-defined SQL as the database administrator.

- New installs require separate administrator and application credentials. The API and the migration entry points check the role PostgreSQL actually authenticated. A legacy superuser login, a privileged attribute or an explicit role membership stops startup. The application still owns the application database and its migration objects.
- On an existing volume, the bootstrap installs pgvector and changes application object ownership in one transaction. It checks effective grants, including grants to PUBLIC, on restricted routines and system catalogs. It refuses unsafe grants without resetting the old password or moving objects. Privileged routines and extension objects retain their owners.
- The nightly job uses the limited login and a matching container-side pg_dump. It writes a custom archive into a root-only directory (0700), keeps the file private (0600), and prunes old archives only after success. The restore command requires a separate, empty bootstrapped target. It restores over TCP as the application login, omits source owners and grants, and rolls back on error. The unused commit-time SQL dump script and its superuser default were removed.
- The deployer sends database and RBAC credentials to Ansible through environment lookups. The GitHub and Portainer helpers receive JSON on stdin. The SSH inventory and service credential files are private. Both Actions environments keep their existing secret mappings and write values as data rather than inserting them into shell code.

## Verification

- `npm run database:test:integration` runs real PostgreSQL 17 with pgvector, using isolated containers for initialization, upgrade and restore. It verifies rollback on unsafe direct/PUBLIC grants, a privileged function, a catalog-column grant, role memberships and an interrupted ownership transfer. A successful retry preserves an existing sequence, view and rows.
- A CHECK function in the source dump requires both session_user and current_user to equal the application login during restore. A second archive attempts COPY TO PROGRAM during restore; PostgreSQL denies it and rolls back even the schema. Superuser and non-empty restore targets are refused.
- `npm run database:test` (21 tests), `npm run secrets:test` (9), API Jest (19), and MCP client config tests (41) pass. The 24 modified Ansible plays pass syntax checking. A Linux user without privileges could read the deployment argv but found no test credentials there. Real Ansible received the original values. No external credentials or production systems were used.
- Full `./migrate.sh seed` passed on PostgreSQL 17.10 on a new volume (325 application-owned tables) and after moving an existing volume (326, including the old table and its original row). Recovery of the full seeded archive to a third database preserved the RBAC Subject count and a control row. Consistency and Knowledge Source/Chunk migrations also ran against an already populated schema.
- Code placement passes on the changed paths. The repository-wide check also reports the pre-existing Studio `interface-kit/Files.tsx` alongside `Files/` on main.

## Downstream migration

See [PostgreSQL roles, backups and recovery](https://github.com/singlepagestartup/singlepagestartup/blob/claude/issue-318-db-role-backups/tools/deployer/README.md#postgresql-roles).

1. Existing installations: preserve the old volume, stop the old API, put its original administrator credentials in POSTGRES_USER / POSTGRES_PASSWORD, and choose a separate application login and password for DATABASE_USERNAME / DATABASE_PASSWORD. Configure both pairs in local/deployer envs and the production and preview GitHub secret sets. Redeploy PostgreSQL and run create_application_role.sh in the database container before starting the API.
2. Review any refused privileges, including PUBLIC grants, before retrying. Do not restore privileged functions into the application role to make an upgrade pass. Managed clusters and custom extensions need a separate grant review for every database the login can reach.
3. Reinstall the backup job with server.sh, make a new custom archive, and recover it to an empty target with restore_db_dump.sh. Earlier plain SQL dumps need separate recovery planning; never replay one as the administrator. Check known rows, the application login and any project-owned grants before cutover. Keep a copy off the database host.
4. Adapt project-owned Ansible wrappers and GitHub/Portainer helpers to the new environment/stdin inputs. Rotate secrets if previous process arguments were visible to untrusted users. Integrations that relied on the old commit-time dump must switch to the explicit backup command.
