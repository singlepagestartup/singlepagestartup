#!/usr/bin/env bash

# Pass only variable names on the control node's command line. Ansible looks
# up the values in its own environment; the exports last only for this play.
ansible_with_vars() (
    local playbook="$1" key variables="" separator=""
    shift
    for key in "$@"; do
        if [[ ! "$key" =~ ^[A-Z][A-Z0-9_]*$ ]]; then
            echo "Invalid Ansible variable name" >&2
            return 1
        fi
        export "$key"
        variables+="${separator}\"$key\":\"{{ lookup('ansible.builtin.env', '$key') }}\""
        separator=","
    done
    ansible-playbook "$playbook" --extra-vars "{$variables}"
)
