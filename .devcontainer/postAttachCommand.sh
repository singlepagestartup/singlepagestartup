#!/bin/bash
terminal=$1

if [ "$terminal" == "infrastructure" ];
then
    # wait until docker is started
    while ! docker ps
    do
        sleep 1
        echo "Waiting to Docker start..."
    done

    cd apps/db
    chmod +x ./up.sh
    ./up.sh

    cd ../redis
    chmod +x ./up.sh
    ./up.sh

    cd ..
    npm install
fi

if [ "$terminal" == "host" ];
then
    gh codespace ports visibility 8080:public -c $CODESPACE_NAME
    gh codespace ports visibility 3000:public -c $CODESPACE_NAME

    chmod +x ./create_env.sh
    ./create_env.sh
fi