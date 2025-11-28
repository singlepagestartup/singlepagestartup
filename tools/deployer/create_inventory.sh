#!/bin/bash
. ./get_env.sh

cat <<EOL > inventory.yaml
ungrouped:
  vars:
    ansible_ssh_common_args: "-o UserKnownHostsFile=/dev/null"
  hosts:
    $(get_env "$BASH_SOURCE" "ANSIBLE_HOST"):
      ansible_user: $(get_env "$BASH_SOURCE" "ANSIBLE_USER")
      ansible_password: $(get_env "$BASH_SOURCE" "ANSIBLE_PASSWORD")
EOL