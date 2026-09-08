#!/bin/bash

# Rufflo Command Center - VS Code Tunnel Setup Script
# Automatically downloads and configures the VS Code CLI tool inside the cloud workspace container,
# enabling a secure, zero-config link for local editing with instant remote synchronization.

set -e

# Color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;37m' # No Color
BOLD='\033[1m'

echo -e "${CYAN}${BOLD}===================================================================${NC}"
echo -e "${CYAN}${BOLD}   ⚡ RUFFLO COMMAND CENTER - VS CODE REMOTE TUNNEL CONFIGURATOR ⚡  ${NC}"
echo -e "${CYAN}${BOLD}===================================================================${NC}"

# 1. Create a local bin directory if it doesn't exist
BIN_DIR="./bin"
mkdir -p "$BIN_DIR"

CODE_BIN="$BIN_DIR/code"

# 2. Check if the VS Code CLI binary is already present
if [ -f "$CODE_BIN" ]; then
    echo -e "${GREEN}✔ VS Code CLI is already installed at $CODE_BIN${NC}"
else
    echo -e "${YELLOW}⏳ Downloading official VS Code CLI (Linux x64)...${NC}"
    
    # URL for Linux x64 standalone CLI tarball
    DOWNLOAD_URL="https://update.code.visualstudio.com/latest/cli-linux-x64/stable"
    TEMP_TAR="/tmp/vscode_cli.tar.gz"
    
    # Download using curl
    if curl -L -s -o "$TEMP_TAR" "$DOWNLOAD_URL"; then
        echo -e "${GREEN}✔ Download complete! Extracting...${NC}"
        tar -xzf "$TEMP_TAR" -C "$BIN_DIR"
        rm -f "$TEMP_TAR"
        chmod +x "$CODE_BIN"
        echo -e "${GREEN}✔ Extracted and made executable: $CODE_BIN${NC}"
    else
        echo -e "${RED}❌ Failed to download VS Code CLI. Please verify your internet connection.${NC}"
        exit 1
    fi
fi

echo -e "\n${GREEN}${BOLD}🎉 VS Code CLI is configured and ready!${NC}"
echo -e "${CYAN}-------------------------------------------------------------------${NC}"
echo -e "${BOLD}To start editing files locally with real-time remote sync, do this:${NC}"
echo -e "1. run: ${YELLOW}./bin/code tunnel${NC}"
echo -e "2. Follow the prompt to visit: ${YELLOW}https://github.com/login/device${NC} (or Microsoft link)"
echo -e "3. Enter the 8-character verification code displayed in your terminal."
echo -e "4. Once authorized, VS Code will provide a tunnel link, for example:"
echo -e "   ${GREEN}https://vscode.dev/tunnel/<your-machine-name>/workspace${NC}"
echo -e "5. Open that link in your browser to launch VS Code Web OR connect via your"
echo -e "   desktop VS Code app by installing the ${CYAN}Remote - Tunnels${NC} extension."
echo -e "${CYAN}-------------------------------------------------------------------${NC}"
echo -e "${YELLOW}💡 Every save in VS Code is applied instantly to the remote container filesystem,${NC}"
echo -e "${YELLOW}   automatically triggerring hot-reload/rebuild on your live preview server!${NC}"
echo -e "${CYAN}===================================================================${NC}\n"
