#!/bin/bash
terminal=$1

if [ "$terminal" == "infrastructure" ];
then
    # adminer
    gh codespace ports visibility 8080:public -c $CODESPACE_NAME
    # frontend
    gh codespace ports visibility 3000:public -c $CODESPACE_NAME
    # backend
    gh codespace ports visibility 4000:public -c $CODESPACE_NAME
    # telegram
    gh codespace ports visibility 8000:public -c $CODESPACE_NAME
    
    npm install

    # wait until docker is started
    while ! docker ps
    do
        sleep 1
        echo "Waiting to Docker start..."
    done

    # Not default Github Codespace not connects to Github, that's why you shoud do it manually, use .devcontainer/README.md
    cd apps/db
    chmod +x ./up.sh

    cd ../redis
    chmod +x ./up.sh

    cd ../..
    
    # run up.sh script to setup infrastructure
    chmod +x ./up.sh
    ./up.sh
fi