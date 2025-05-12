#!/bin/bash
set -e

TARGET_DIR="pass-web"
REPO_URL="ssh://git@192.168.1.131:2222/roberto/pass-web.git"

check_dependencies() {
    local missing=0
    if ! command -v git &>/dev/null; then
        echo "Error: 'git' is not installed or not in PATH." >&2
        missing=1
    fi
    if ! command -v docker &>/dev/null; then
        echo "Error: 'docker' is not installed or not in PATH." >&2
        missing=1
    fi
    if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
        echo "Error: Neither 'docker-compose' nor 'docker compose' (v2) found in PATH." >&2
        missing=1
    fi
    if [ "$missing" -eq 1 ]; then
        exit 1
    fi
}

pull_repo() {
    echo "--- Git Operations ---"
    if [ -d "$TARGET_DIR/.git" ]; then
        echo "Repository '$TARGET_DIR' already exists. Updating..."
        cd "$TARGET_DIR"
        git pull origin main || { echo "Error running git pull." >&2; cd ..; return 1; }
        cd ..
    else
        echo "Cloning repository from $REPO_URL into '$TARGET_DIR'..."
        git clone "$REPO_URL" "$TARGET_DIR" || { echo "Error running git clone." >&2; return 1; }
    fi
    echo "Repository updated/cloned successfully."
    return 0
}

generate_config() {
    local p_path="${1:-}"

    if [[ -z "$p_path" ]]; then
        local script_dir
        script_dir=$(dirname "$(realpath "$0")")
        p_path=$(dirname "$script_dir")
        echo "--- Generating Configuration (calculated project path: $p_path) ---"
    else
        echo "--- Generating Configuration (provided project path: $p_path) ---"
        if [[ "$p_path" != /* && -e "$p_path" ]]; then
           p_path="$(realpath "$p_path")"
        elif [[ ! -d "$p_path" ]]; then
           echo "Error: Provided project path '$p_path' does not exist or is not a directory." >&2
           return 1
        fi
    fi

    local project_path="$p_path"
    local script_dir="$project_path/ops" # Base script dir relative to project root

    if [ ! -d "$script_dir" ]; then
       echo "Warning: 'ops' directory not found within project path '$project_path'." >&2
    fi

    local output_file_backend="$project_path/.env"
    local frontend_dir="$project_path/frontend"
    local output_file_frontend="$frontend_dir/.env"

    declare -A defaults
    defaults["ENVIRONMENT"]='prod'
    defaults["ADMIN_USERNAME"]='admin'
    defaults["ADMIN_PASSWORD_PLAIN"]='testing'
    defaults["GPG_SECRET_PASSPHRASE"]='testing'
    defaults["JWT_SECRET_KEY"]='GENERATE_ME_$(openssl rand -hex 32)'
    defaults["JWT_ALGORITHM"]='HS256'
    defaults["JWT_EXPIRATION"]='30'
    defaults["CORS_ALLOW"]='http://localhost:3000'
    defaults["VITE_API_URL"]='http://localhost:8000'

    prompt_variable() {
        local var_name="$1"
        local comment="$2"
        local target_file="$3"
        local default_value="${defaults[$var_name]:-}"
        local current_value=""
        local prompt_text="Value for ${var_name}"

        if [[ -n "$default_value" ]]; then
             prompt_text+=" [${default_value}]"
        fi
        prompt_text+=": "

        if [[ -n "$comment" ]]; then
            echo "$comment" >> "$target_file"
        fi

        read -e -p "$prompt_text" -i "${default_value}" current_value  < /dev/tty
        current_value="${current_value:-$default_value}"

        if [[ "$var_name" == "JWT_SECRET_KEY" && "$current_value" == "GENERATE_ME_"* ]]; then
             if command -v openssl &>/dev/null; then
                 echo "Generating JWT_SECRET_KEY using openssl..."
                 current_value=$(openssl rand -hex 32)
                 echo "Generated Key: $current_value"
             else
                 echo "Error: openssl command not found. Please generate a 32-byte hex key manually for JWT_SECRET_KEY." >&2
                 current_value="PLEASE_REPLACE_MANUALLY_WITH_32_BYTE_HEX_KEY"
             fi
        fi

        echo "${var_name}=\"${current_value}\"" >> "$target_file"
        echo "" >> "$target_file"
    }

    echo "Generating backend env file: $output_file_backend"
    mkdir -p "$(dirname "$output_file_backend")"
    > "$output_file_backend"

    echo "Generating frontend env file: $output_file_frontend"
    mkdir -p "$frontend_dir"
    > "$output_file_frontend"

    prompt_variable "ENVIRONMENT [dev|prod]" "# Can be: dev | prod | testing" "$output_file_backend"
    echo "# WEB" >> "$output_file_backend"
    prompt_variable "ADMIN_USERNAME" "" "$output_file_backend"

    echo "# ADMIN_PASSWORD - Hashed (do not edit directly)" >> "$output_file_backend"
    echo "Enter the PLAIN TEXT password for the admin user. It will be hashed and stored."
    read -e -p "Plain text password for ADMIN_PASSWORD [${defaults[ADMIN_PASSWORD_PLAIN]}]: " -i "${defaults[ADMIN_PASSWORD_PLAIN]}" admin_plain_pwd  < /dev/tty
    admin_plain_pwd="${admin_plain_pwd:-${defaults[ADMIN_PASSWORD_PLAIN]}}"

    local generate_hash_script="$project_path/ops/generate_hash.sh"

    if [ ! -f "$generate_hash_script" ]; then
        echo "Error: Hash generation script not found at '$generate_hash_script'" >&2
        echo "Project path determined as: $project_path" >&2
        return 1
    fi
    HASH_OUTPUT=$(bash "$generate_hash_script" "$admin_plain_pwd" 2>&1)
    ADMIN_HASH=$(echo "$HASH_OUTPUT" | grep -E '^\$2[aby]\$')

    if [[ -z "$ADMIN_HASH" ]]; then
        echo "Error: Failed to generate bcrypt hash for ADMIN_PASSWORD." >&2
        echo "generate_hash.sh output:" >&2
        echo "$HASH_OUTPUT" >&2
        return 1
    fi
    echo "ADMIN_PASSWORD='${ADMIN_HASH}'" >> "$output_file_backend"
    echo "" >> "$output_file_backend"

    echo "# GPG" >> "$output_file_backend"
    prompt_variable "GPG_SECRET_PASSPHRASE" "" "$output_file_backend"
    echo "# JWT" >> "$output_file_backend"
    prompt_variable "JWT_SECRET_KEY" "## Generate with 'openssl rand -hex 32' or accept auto-generation. KEEP IT SECRET!" "$output_file_backend"
    prompt_variable "JWT_ALGORITHM" "" "$output_file_backend"
    prompt_variable "JWT_EXPIRATION" "# Expiration time (e.g., in minutes or days - check app docs)" "$output_file_backend"
    echo "# CORS" >> "$output_file_backend"
    prompt_variable "CORS_ALLOW" "# Allowed origin(s) for frontend requests" "$output_file_backend"

    echo "## Frontend specific variables" >> "$output_file_frontend"
    echo "" >> "$output_file_frontend"
    prompt_variable "VITE_API_URL" "# URL of the backend API" "$output_file_frontend"
    echo "# Frontend Theme (uncomment desired theme)" >> "$output_file_frontend"
    echo 'VITE_APP_THEME="retro"' >> "$output_file_frontend"
    echo '#VITE_APP_THEME=cyberpunk' >> "$output_file_frontend"
    echo '#VITE_APP_THEME=default' >> "$output_file_frontend"
    echo "" >> "$output_file_frontend"

    awk 'NF > 0 {p=1} p' "$output_file_backend" > tmp_backend && mv tmp_backend "$output_file_backend"
    awk 'NF > 0 {p=1} p' "$output_file_frontend" > tmp_frontend && mv tmp_frontend "$output_file_frontend"

    echo "File '$output_file_backend' generated ✅"
    echo "File '$output_file_frontend' generated ✅"
    return 0
}

run_docker() {
    local p_path="${1:-}"

     if [[ -z "$p_path" ]]; then
        local script_dir
        script_dir=$(dirname "$(realpath "$0")")
        p_path=$(dirname "$script_dir")
        echo "--- Docker Operations (calculated project path: $p_path) ---"
    else
         echo "--- Docker Operations (provided project path: $p_path) ---"
         if [[ "$p_path" != /* && -e "$p_path" ]]; then
            p_path="$(realpath "$p_path")"
         elif [[ ! -d "$p_path" ]]; then
            echo "Error: Provided project path '$p_path' does not exist or is not a directory." >&2
            return 1
         fi
    fi

    local project_path="$p_path"
    local docker_compose_file="$project_path/docker-compose.yml"

    if [ ! -f "$docker_compose_file" ]; then
        echo "Error: docker-compose.yml not found at '$docker_compose_file'" >&2
        return 1
    fi

    echo "Changing directory to project root: $project_path"
    cd "$project_path" || { echo "Error changing directory to $project_path"; return 1; }

    echo "Deploying containers using Docker Compose..."

    if docker compose version &>/dev/null; then
        echo "Using 'docker compose' (v2)"
        docker compose up -d backend frontend || { echo "Error running 'docker compose up'."; return 1; }
    elif command -v docker-compose &>/dev/null; then
        echo "Using 'docker-compose' (v1)"
        docker-compose up -d backend frontend || { echo "Error running 'docker-compose up'."; return 1; }
    else
        echo "Error: Cannot find a valid docker compose command." >&2
        return 1
    fi

    echo "Docker containers started."
    return 0
}

main() {
    check_dependencies

    local action=${1:-all}

    case "$action" in
        config)
             echo "Running config generation..."
             generate_config || exit 1
            ;;
        exec_docker)
             echo "Running Docker deployment..."
             run_docker || exit 1
            ;;
        clone)
             echo "Running Git operations only..."
             pull_repo || exit 1
            ;;
        all)
            echo "--- Running Full Setup (Clone/Pull -> Config -> Docker) ---"
            pull_repo || exit 1

            local project_root_abs
            project_root_abs="$(realpath "$TARGET_DIR")"

            if [ ! -d "$project_root_abs" ]; then
                echo "Error: Project directory '$TARGET_DIR' not found after clone/pull at expected location." >&2
                exit 1
            fi

            echo "Project root identified at: $project_root_abs"

            generate_config "$project_root_abs" || exit 1
            run_docker "$project_root_abs" || exit 1

            echo "--- Full Setup Completed Successfully ---"
            ;;
        *)
            echo "Error: Unknown command '$1'" >&2
            echo "Usage: $0 [all|clone|config|exec_docker]" >&2
            echo "  all (default): Clones/updates repo, generates config, runs Docker."
            echo "  clone:         Only clones or updates the repository."
            echo "  config:        Only generates configuration files (requires repo exists)."
            echo "  exec_docker:   Only runs 'docker-compose up' (requires repo/config exists)."
            exit 1
            ;;
    esac

    exit 0
}

main "$@"