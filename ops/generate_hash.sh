#!/bin/bash

set -e

script_dir=$(dirname "$(realpath "$0")")
project_path=$(dirname "$script_dir")

PYTHON_SCRIPT="$project_path/ops/hash_password.py"
VENV_DIR=$(mktemp -d /tmp/pw_hasher_env.XXXXXX)

cleanup() {
    echo "Cleaning up temporary virtual environment..."
    if type deactivate &>/dev/null; then
        deactivate
    fi
    rm -rf "$VENV_DIR"
    echo "Cleanup complete."
}

trap cleanup EXIT

if [ ! -f "$PYTHON_SCRIPT" ]; then
    echo "Error: Python script '$PYTHON_SCRIPT' not found." >&2
    exit 1
fi

PYTHON_EXEC=""
if command -v python3 &>/dev/null; then
    PYTHON_EXEC="python3"
elif command -v python &>/dev/null; then
    PYTHON_EXEC="python"
else
    echo "Error: Neither 'python3' nor 'python' command found." >&2
    exit 1
fi

echo "Using Python: $($PYTHON_EXEC --version)"
echo "Creating temporary virtual environment in $VENV_DIR..."
$PYTHON_EXEC -m venv "$VENV_DIR"

echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

echo "Installing passlib..."
pip install --disable-pip-version-check -q "passlib[bcrypt]"

if [ -n "$1" ]; then
    PLAIN_PASSWORD="$1"
else
    PLAIN_PASSWORD=""
fi

echo "Executing script to generate hash..."
if [ -n "$PLAIN_PASSWORD" ]; then
    HASHED_PASSWORD=$($PYTHON_EXEC "$PYTHON_SCRIPT" "$PLAIN_PASSWORD")
else
    HASHED_PASSWORD=$($PYTHON_EXEC "$PYTHON_SCRIPT")
fi

if [ -z "$HASHED_PASSWORD" ]; then
    echo "Error: Failed to generate hash (Python script produced no output)." >&2
    exit 1
fi

if [[ ! "$HASHED_PASSWORD" =~ ^\$2[aby]\$.* ]]; then
    echo "Error: The output does not look like a valid bcrypt hash." >&2
    echo "Output was: $HASHED_PASSWORD"
    exit 1
fi

echo "$HASHED_PASSWORD"
exit 0
