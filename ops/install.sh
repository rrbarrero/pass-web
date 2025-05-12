#!/bin/bash
set -e

TARGET_DIR="pass-web"
REPO_URL="git@github.com:rrbarrero/pass-web.git"

check_dependencies() {
    echo "🔍 Checking dependencies..."
    local missing=0
    if ! command -v git &>/dev/null; then
        echo "❌ Missing required command: git"
        missing=1
    fi
    if ! command -v docker &>/dev/null; then
        echo "❌ Missing required command: docker"
        missing=1
    fi
    if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null; then
        echo "❌ Missing required command: docker-compose or docker compose"
        missing=1
    fi
    if [ "$missing" -eq 1 ]; then
        echo "💡 Please install the missing tools and try again."
        exit 1
    fi
    echo "✅ All dependencies are installed."
}

pull_repo() {
    echo "📦 Git Repository Setup"
    if [ -d "$TARGET_DIR/.git" ]; then
        echo "🔄 Repository '$TARGET_DIR' already exists. Pulling latest changes..."
        cd "$TARGET_DIR"
        git pull origin main || { echo "❌ Failed to pull latest changes." >&2; cd ..; return 1; }
        cd ..
    else
        echo "📥 Cloning repository from $REPO_URL into '$TARGET_DIR'..."
        git clone "$REPO_URL" "$TARGET_DIR" || { echo "❌ Failed to clone repository." >&2; return 1; }
    fi
    echo "✅ Repository is up-to-date."
    return 0
}

generate_config() {
    local p_path="${1:-}"

    if [[ -z "$p_path" ]]; then
        local script_dir
        script_dir=$(dirname "$(realpath "$0")")
        p_path=$(dirname "$script_dir")
        echo "🛠️  Generating Configuration (calculated project path: $p_path)"
    else
        echo "🛠️  Generating Configuration (provided project path: $p_path)"
        if [[ "$p_path" != /* && -e "$p_path" ]]; then
           p_path="$(realpath "$p_path")"
        elif [[ ! -d "$p_path" ]]; then
           echo "❌ Provided project path '$p_path' does not exist." >&2
           return 1
        fi
    fi

    local project_path="$p_path"
    local script_dir="$project_path/ops"
    local output_file_backend="$project_path/.env"
    local frontend_dir="$project_path/frontend"
    local output_file_frontend="$frontend_dir/.env"

    declare -A defaults=(
        ["ENVIRONMENT"]='prod'
        ["ADMIN_USERNAME"]='admin'
        ["ADMIN_PASSWORD_PLAIN"]='testing'
        ["GPG_SECRET_PASSPHRASE"]='testing'
        ["JWT_SECRET_KEY"]=''
        ["JWT_ALGORITHM"]='HS256'
        ["JWT_EXPIRATION"]='30'
        ["CORS_ALLOW"]='http://localhost:3000'
        ["VITE_API_URL"]='http://localhost:8000'
    )

    prompt_variable() {
        local var_name="$1"
        local comment="$2"
        local target_file="$3"
        local default_value="${defaults[$var_name]:-}"
        local current_value=""

        if [[ "$var_name" == "JWT_SECRET_KEY" ]]; then
            prompt_text="🔐 Enter JWT_SECRET_KEY (leave blank to auto-generate a secure 32-byte hex key): "
        else
            prompt_text="🔧 Enter value for ${var_name}"
            if [[ -n "$default_value" ]]; then
                prompt_text+=" [${default_value}]"
            fi
            prompt_text+=": "
        fi

        if [[ -n "$comment" ]]; then
            echo "$comment" >> "$target_file"
        fi

        read -e -p "$prompt_text" -i "${default_value}" current_value  < /dev/tty
        current_value="${current_value:-$default_value}"

        if [[ "$var_name" == "JWT_SECRET_KEY" && -z "$current_value" ]]; then
             if command -v openssl &>/dev/null; then
                 echo "🔑 Generating secure JWT secret key..."
                 current_value=$(openssl rand -hex 32)
                 echo "✅ Key generated: $current_value"
             else
                 echo "❌ openssl not found. Please manually generate a 32-byte hex key." >&2
                 current_value="PLEASE_REPLACE_MANUALLY_WITH_32_BYTE_HEX_KEY"
             fi
        fi

        echo "${var_name}=\"${current_value}\"" >> "$target_file"
        echo "" >> "$target_file"
    }

    echo "💾 Generating backend .env: $output_file_backend"
    mkdir -p "$(dirname "$output_file_backend")"
    > "$output_file_backend"

    echo "💾 Generating frontend .env: $output_file_frontend"
    mkdir -p "$frontend_dir"
    > "$output_file_frontend"

    prompt_variable "ENVIRONMENT" "# Can be: dev | prod | testing" "$output_file_backend"
    echo "# WEB" >> "$output_file_backend"
    prompt_variable "ADMIN_USERNAME" "" "$output_file_backend"

    echo "# ADMIN_PASSWORD - Hashed (do not edit manually)" >> "$output_file_backend"
    echo "🔐 Enter the plain text password for the admin user (it will be hashed securely)."
    read -e -p "🔧 Admin password [${defaults[ADMIN_PASSWORD_PLAIN]}]: " -i "${defaults[ADMIN_PASSWORD_PLAIN]}" admin_plain_pwd  < /dev/tty
    admin_plain_pwd="${admin_plain_pwd:-${defaults[ADMIN_PASSWORD_PLAIN]}}"

    local generate_hash_script="$project_path/ops/generate_hash.sh"
    if [ ! -f "$generate_hash_script" ]; then
        echo "❌ Hash script not found at '$generate_hash_script'" >&2
        return 1
    fi
    HASH_OUTPUT=$(bash "$generate_hash_script" "$admin_plain_pwd" 2>&1)
    ADMIN_HASH=$(echo "$HASH_OUTPUT" | grep -E '^\$2[aby]\$')

    if [[ -z "$ADMIN_HASH" ]]; then
        echo "❌ Failed to generate bcrypt hash for ADMIN_PASSWORD." >&2
        echo "$HASH_OUTPUT" >&2
        return 1
    fi
    echo "ADMIN_PASSWORD='${ADMIN_HASH}'" >> "$output_file_backend"
    echo "" >> "$output_file_backend"

    echo "# GPG" >> "$output_file_backend"
    prompt_variable "GPG_SECRET_PASSPHRASE" "" "$output_file_backend"
    echo "# JWT" >> "$output_file_backend"
    prompt_variable "JWT_SECRET_KEY" "## Generate with 'openssl rand -hex 32' or accept auto-generation." "$output_file_backend"
    prompt_variable "JWT_ALGORITHM" "" "$output_file_backend"
    prompt_variable "JWT_EXPIRATION" "# Expiration time (e.g., in minutes)" "$output_file_backend"
    echo "# CORS" >> "$output_file_backend"
    prompt_variable "CORS_ALLOW" "# Allowed origin(s) for frontend requests" "$output_file_backend"

    echo "## Frontend specific variables" >> "$output_file_frontend"
    echo "" >> "$output_file_frontend"
    prompt_variable "VITE_API_URL" "# Backend API URL" "$output_file_frontend"
    echo "# Frontend Theme (uncomment desired theme)" >> "$output_file_frontend"
    echo 'VITE_APP_THEME="retro"' >> "$output_file_frontend"
    echo '#VITE_APP_THEME=cyberpunk' >> "$output_file_frontend"
    echo '#VITE_APP_THEME=default' >> "$output_file_frontend"
    echo "" >> "$output_file_frontend"

    awk 'NF > 0 {p=1} p' "$output_file_backend" > tmp_backend && mv tmp_backend "$output_file_backend"
    awk 'NF > 0 {p=1} p' "$output_file_frontend" > tmp_frontend && mv tmp_frontend "$output_file_frontend"

    echo "✅ Backend configuration saved to $output_file_backend"
    echo "✅ Frontend configuration saved to $output_file_frontend"
    return 0
}

run_docker() {
    local p_path="${1:-}"

    if [[ -z "$p_path" ]]; then
        local script_dir
        script_dir=$(dirname "$(realpath "$0")")
        p_path=$(dirname "$script_dir")
        echo "🐳 Docker Setup (calculated project path: $p_path)"
    else
        echo "🐳 Docker Setup (provided project path: $p_path)"
        if [[ "$p_path" != /* && -e "$p_path" ]]; then
            p_path="$(realpath "$p_path")"
        elif [[ ! -d "$p_path" ]]; then
            echo "❌ Provided project path '$p_path' is invalid." >&2
            return 1
        fi
    fi

    local project_path="$p_path"
    local docker_compose_file="$project_path/docker-compose.yml"

    if [ ! -f "$docker_compose_file" ]; then
        echo "❌ docker-compose.yml not found at '$docker_compose_file'" >&2
        return 1
    fi

    echo "📁 Switching to: $project_path"
    cd "$project_path" || { echo "❌ Cannot enter directory: $project_path"; return 1; }

    echo "🚀 Starting Docker containers..."
    if docker compose version &>/dev/null; then
        echo "🔧 Using 'docker compose' (v2)"
        docker compose up -d backend frontend || { echo "❌ Failed to start containers."; return 1; }
    elif command -v docker-compose &>/dev/null; then
        echo "🔧 Using 'docker-compose' (v1)"
        docker-compose up -d backend frontend || { echo "❌ Failed to start containers."; return 1; }
    else
        echo "❌ No compatible Docker Compose command found." >&2
        return 1
    fi

    echo "✅ Containers are now running!. You can check .env files for configuration."
    return 0
}

main() {
    check_dependencies

    local action=${1:-all}
    case "$action" in
        config)
            echo "⚙️  Generating config only..."
            generate_config || exit 1
            ;;
        exec_docker)
            echo "🐳 Running Docker only..."
            run_docker || exit 1
            ;;
        clone)
            echo "📦 Cloning repository only..."
            pull_repo || exit 1
            ;;
        all)
            echo "--- 🚀 Full Setup: Clone → Config → Docker ---"
            pull_repo || exit 1
            local project_root_abs
            project_root_abs="$(realpath "$TARGET_DIR")"
            if [ ! -d "$project_root_abs" ]; then
                echo "❌ Project directory '$TARGET_DIR' not found." >&2
                exit 1
            fi
            echo "📁 Project root: $project_root_abs"
            generate_config "$project_root_abs" || exit 1
            run_docker "$project_root_abs" || exit 1
            echo "🎉 Setup completed successfully!"
            ;;
        *)
            echo "❌ Unknown command: '$1'"
            echo "📖 Usage: $0 [all|clone|config|exec_docker]"
            echo "  all (default): Clone/update repo, generate config, run Docker."
            echo "  clone:         Only clone or update the repository."
            echo "  config:        Only generate configuration files."
            echo "  exec_docker:   Only start Docker containers."
            exit 1
            ;;
    esac

    exit 0
}

main "$@"
