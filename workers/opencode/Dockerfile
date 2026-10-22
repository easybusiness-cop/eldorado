FROM node:24-bookworm-slim

ARG OPENCODE_VERSION=1.19.4
RUN npm install --global --omit=dev "opencode-ai@${OPENCODE_VERSION}" \
    && npm cache clean --force \
    && mkdir -p /workspace \
    && chown -R node:node /workspace /home/node

USER node
WORKDIR /workspace
EXPOSE 4096

ENTRYPOINT ["opencode", "serve", "--hostname", "0.0.0.0", "--port", "4096"]
