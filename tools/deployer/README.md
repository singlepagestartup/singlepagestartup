# SPS deployer

The deployer provisions a Linux host with Ansible and deploys SPS services to a
Docker Swarm. AWS Lightsail is supported through the same playbooks as other
Ubuntu hosts.

## AWS Lightsail requirements

- Use an Ubuntu 22.04 or 24.04 instance.
- Use an x86_64 instance for a full SPS deployment. The current GitHub Actions
  image workflow publishes an image for the runner architecture only; ARM64
  instances require SPS images to be published as multi-platform images first.
- Attach a static IP address to the instance.
- Allow inbound TCP ports `22`, `80`, and `443` in the Lightsail firewall.
- Download the private key for the instance and restrict its permissions:

  ```bash
  chmod 400 ~/Downloads/LightsailDefaultKey.pem
  ```

The deployer configures the instance. It does not create the Lightsail instance,
static IP, DNS records, or firewall rules.

## Local deployment with an SSH key

Run deployer commands from `tools/deployer` because the service scripts load
their environment files relative to that directory:

```bash
cd tools/deployer
cp .env.example .env
```

Configure these values in `.env`:

```dotenv
ANSIBLE_HOST=203.0.113.10
ANSIBLE_PORT=22
ANSIBLE_USER=ubuntu
ANSIBLE_PRIVATE_KEY_FILE=/absolute/path/to/LightsailDefaultKey.pem
ANSIBLE_PRIVATE_KEY_BASE64=
ANSIBLE_PASSWORD=
```

Generate the inventory and verify SSH access before provisioning:

```bash
./create_inventory.sh
ansible all -m ping
```

Inventory generation restricts the configured private key to mode `0600`,
which is accepted by OpenSSH and prevents accidental group or public access.

Then provision the server and deploy all configured services:

```bash
./up.sh
```

To provision only the server prerequisites without deploying the application
services, run `./server.sh up` instead.

Password authentication remains available for other providers by leaving both
private-key variables empty and setting `ANSIBLE_PASSWORD`.

The server playbook adds `ANSIBLE_USER` to the `docker` group. An SSH session
that was already open before provisioning must be closed and opened again
before commands such as `docker ps` work without `sudo`.

## Let's Encrypt certificates

The non-Cloudflare deployment serves HTTP-01 challenge files through the
Certbot nginx container and Traefik's Docker Swarm provider. The deployer:

- creates the shared `traefik_overlay` network explicitly;
- keeps the host's system nginx disabled so Traefik owns ports 80 and 443;
- verifies that the challenge file is publicly reachable before invoking
  Certbot.

DNS must resolve each service hostname to `ANSIBLE_HOST`, and inbound TCP port
`80` must remain open until certificate issuance finishes. If certificate
creation stops at `Verify ACME webroot is publicly reachable`, check DNS and
the Lightsail firewall first; Certbot has not contacted Let's Encrypt yet.

## GitHub Actions deployment

GitHub-hosted runners cannot use a local key path. Encode the private key as one
line and store it as a repository secret:

```bash
base64 < ~/Downloads/LightsailDefaultKey.pem | tr -d '\n'
```

Configure the following secrets for the production deployment:

- `ANSIBLE_HOST`
- `ANSIBLE_PORT` (`22` for a default Lightsail instance)
- `ANSIBLE_USER` (`ubuntu` for a Lightsail Ubuntu image)
- `ANSIBLE_PRIVATE_KEY_BASE64`

Leave `ANSIBLE_PASSWORD` empty. Preview deployments use the corresponding
`PREVIEW_ANSIBLE_*` secrets. The workflow decodes the key into an ignored file
with mode `0600` before Ansible connects. When `github_deployer.sh` is used, it
encodes `ANSIBLE_PRIVATE_KEY_FILE` automatically if
`ANSIBLE_PRIVATE_KEY_BASE64` is empty.

Never commit a Lightsail private key, the generated `inventory.yaml`, or a real
`.env` file. They are ignored by the repository.
