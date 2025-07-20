import yaml
import sys
import os

service_url = sys.argv[1]
action = sys.argv[2] if len(sys.argv) > 2 else "add"

cert_path = "/certs/" + service_url + ".crt"
key_path = "/certs/" + service_url + ".key"

traefik_file = "/home/code/traefik.yml"

if not os.path.exists(traefik_file):
    print(f"File {traefik_file} does not exist.")
    sys.exit(1)

with open(traefik_file, "r") as f:
    data = yaml.safe_load(f)

if "tls" not in data:
    data["tls"] = {}
if "certificates" not in data["tls"]:
    data["tls"]["certificates"] = []

cert_entry = {"certFile": cert_path, "keyFile": key_path}

if action == "add":
    if cert_entry not in data["tls"]["certificates"]:
        data["tls"]["certificates"].append(cert_entry)
elif action == "remove":
    data["tls"]["certificates"] = [
        c for c in data["tls"]["certificates"]
        if not (c.get("certFile") == cert_path and c.get("keyFile") == key_path)
    ]
else:
    print("Usage: python3 yaml_editor.py <domain> [add|remove]")
    sys.exit(1)

with open(traefik_file, "w") as f:
    yaml.safe_dump(data, f)
