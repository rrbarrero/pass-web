FROM debian:bookworm-20250317-slim

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_PROJECT_ENVIRONMENT=/home/user/venv

# create user and drop privileges: user 'user' and group 'user'
RUN apt-get update && apt-get install -y --no-install-recommends gnupg && \
    groupadd -g 1000 user && \
    useradd -u 1000 -g user -m user && \
    mkdir -p /home/user/app && \
    chown -R user:user /home/user && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

USER user

WORKDIR /home/user/app
COPY pyproject.toml .

RUN uv sync

COPY --chown=user:user . /home/user/app
COPY ops/containers/be/entrypoint.sh /usr/local/bin/entrypoint.sh

USER root
RUN chmod +x /usr/local/bin/entrypoint.sh
USER user

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

CMD ["uv", "run", "src/main.py"]
