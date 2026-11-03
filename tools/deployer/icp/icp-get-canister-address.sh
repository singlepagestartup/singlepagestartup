#!/bin/bash
echo $(cat canister_ids.json | grep "ic" | sed -e 's/"ic": "//' | sed -e 's/"//')