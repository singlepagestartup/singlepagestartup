#!/bin/bash

if [ -f .env ]; then
    echo "File .env already exists"
    exit 1
fi

> .env
echo "Created /llm/.env file"

add_env() {
    echo "$1=$2" >> .env
}

get_available_port() {
    START=$1

    while nc -z localhost $START
    do
        START=$((START+1))
    done

    echo $START
}

REPO_NAME=$(basename -s .git `git config --get remote.origin.url`)

add_env "COMPOSE_PROJECT_NAME" $REPO_NAME
add_env "WHISPER_MODEL" "openai/whisper-small"
add_env "WHISPER_DEVICE" "cpu"
add_env "WHISPER_COMPUTE_TYPE" "int8"
add_env "HF_TOKEN" ""
add_env "OPENAI_API_KEY" ""
add_env "OPEN_AI_API_KEY" ""
add_env "ANTHROPIC_API_KEY" ""
add_env "LLM_PRELOAD_MODEL_IDS" ""
add_env "LLM_MAX_LOADED_HF_MODELS" "1"

OLLAMA_PORT=$(get_available_port 11434)

add_env "OLLAMA_PORT" $OLLAMA_PORT
add_env "OLLAMA_URL" "http://localhost:$OLLAMA_PORT"
add_env "OLLAMA_EMBED_MODEL" "nomic-embed-text"
add_env "OLLAMA_MODEL_IDS" "nomic-embed-text"
add_env "OLLAMA_MODELS_DIR" ".ollama/models"
