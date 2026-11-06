Closes #317.

## Summary

Docker builds from a bootstrapped checkout can copy local credentials into the
image. This PR excludes environment files, private keys and deployer state,
and runs the application as the existing `node` user with uid/gid 1000.

## Changes

- Root and LLM build contexts exclude credentials, including nested env files
  local AWS/SSH state and checkout-owned MCP client connections. Root builds
  retain the four tracked runtime defaults, example env files and the two
  helpers used by `create_env.sh`.
- Pin the application image to Node 24.22.2 on Bookworm, Bun to 1.3.6 from
  `package-lock.json`, and the local Redis image to 8.10.3 on Trixie.
- Install Bun in `/usr/local`, copy application files with owner 1000:1000 and
  remove world-writable public-directory permissions.
- Preserve Poppler for Knowledge PDF processing and the current Next static
  release snapshot and deployment ID.
- Deployer setup gives the API upload directory and existing Host static
  volume to uid 1000 before the stack starts.

## Verification

The main update contained one conflict in the Docker dependency installation
step. The resolved version includes Poppler and the pinned Bun installation.
- Docker build checks and Ansible syntax checks passed.
- Both synthetic build contexts excluded their credential fixtures and retained
  the expected defaults and helpers. A separate context check excluded generated
  MCP client configurations and retained their public examples.
- All 11 static synchronization and service-readiness tests passed.
- The application Dockerfile through runtime dependency installation built
  successfully. Node 24.22.2, Bun 1.3.6, Poppler and uid/gid 1000 were verified.
- The local Redis image ran version 8.10.3 and passed authenticated set/get.
- Under uid 1000, upload write/delete and real Next static synchronization passed
  on a new volume. An existing root-owned volume rejected writes, then passed
  synchronization after ownership transfer and preserved the older chunk.
- The [full image verification run](https://github.com/singlepagestartup/singlepagestartup/actions/runs/41831086895)
  uses `VERIFY_ONLY=true`.

## Downstream migration

Projects with customized Dockerfiles, build contexts or persistent writable
mounts need adaptation. Before deploying this image to a server whose application
previously ran as root, give uid/gid 1000 ownership of the API upload directory and
Host static volume. The API and Host setup plays perform these steps.
Release webhooks alone do not run those setup plays.

```bash
sudo chown -R 1000:1000 /home/code/api_data
sudo chown -R 1000:1000 "$(docker volume inspect --format '{{ .Mountpoint }}' host_next_static)"
```

Check project-owned mounts for the same requirement. Keep root-only image
installation steps before `USER node` and match Bun to the lockfile.
Only public defaults belong in the build context. Supply service credentials at
runtime. Verify an upload and Host startup, including static chunk synchronization,
after changing ownership.

The production Redis stack uses its own compose image. This PR's Redis
Dockerfile applies to the local Redis build.
