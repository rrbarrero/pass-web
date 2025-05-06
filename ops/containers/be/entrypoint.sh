#!/bin/bash
set -e # Exit immediately if a command fails

echo "Entrypoint: Configuring GnuPG..."

# Host GnuPG directory mounted temporarily
HOST_GNUPG_DIR="/tmp/host-gnupg"
# GnuPG directory for the user inside the container
TARGET_GNUPG_DIR="/home/user/.gnupg"

# Check if the mounted host directory exists and has content
if [ -d "$HOST_GNUPG_DIR" ] && [ "$(ls -A $HOST_GNUPG_DIR)" ]; then
    echo "Copying GnuPG keys from $HOST_GNUPG_DIR to $TARGET_GNUPG_DIR..."
    # Create the target directory if it doesn't exist
    mkdir -p "$TARGET_GNUPG_DIR"
    # Copy the content
    cp -R $HOST_GNUPG_DIR/* "$TARGET_GNUPG_DIR/"

    echo "Adjusting permissions for $TARGET_GNUPG_DIR..."
    # Change owner to 'user' (UID 1000)
    chown -R user:user "$TARGET_GNUPG_DIR"
    # Set strict permissions (very important for GPG)
    chmod 700 "$TARGET_GNUPG_DIR"
    find "$TARGET_GNUPG_DIR" -type f -exec chmod 600 {} \;
    # Some specific subdirectories might also need 700 if they exist
    find "$TARGET_GNUPG_DIR" -type d -exec chmod 700 {} \;
    echo "GnuPG permissions adjusted."
else
    echo "Warning: Host GnuPG directory not found at $HOST_GNUPG_DIR or it is empty." >&2
    # Create an empty directory with correct permissions to avoid errors, although decryption won't work.
    mkdir -p "$TARGET_GNUPG_DIR"
    chown user:user "$TARGET_GNUPG_DIR"
    chmod 700 "$TARGET_GNUPG_DIR"
fi

# Execute the command passed to the container (CMD or command in docker-compose)
echo "Entrypoint: Executing command: $@"
exec "$@"
