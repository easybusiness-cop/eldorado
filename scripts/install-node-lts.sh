#!/bin/bash

# Rufflo Command Center - Node.js LTS Installer & Configurator
# Detects operating system, environment, and installs/updates to the latest Node.js LTS version.

set -e

# Color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;37m' # No Color
BOLD='\033[1m'

echo -e "${CYAN}${BOLD}===================================================================${NC}"
echo -e "${CYAN}${BOLD}     📥 AUTOMATED NODE.JS LTS DETECTION & INSTALLER AGENT        ${NC}"
echo -e "${CYAN}${BOLD}===================================================================${NC}"

# Detect OS
OS_TYPE="$(uname -s)"
echo -e "Detecting Operating System... ${YELLOW}$OS_TYPE${NC}"

# Target LTS version (V22 is active LTS)
TARGET_LTS="22"

install_via_nvm() {
    echo -e "\n${YELLOW}💡 Using Node Version Manager (NVM) as the target installer...${NC}"
    
    # Check if NVM is already installed
    if [ -z "$NVM_DIR" ]; then
        export NVM_DIR="$HOME/.nvm"
    fi

    if [ -s "$NVM_DIR/nvm.sh" ]; then
        echo -e "${GREEN}✔ NVM is already installed.${NC}"
        # Source nvm
        . "$NVM_DIR/nvm.sh"
    else
        echo -e "⏳ Downloading and installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
        
        # Load NVM for current session
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi

    echo -e "⏳ Installing Node.js LTS v$TARGET_LTS..."
    nvm install "$TARGET_LTS"
    nvm use "$TARGET_LTS"
    nvm alias default "$TARGET_LTS"
    echo -e "${GREEN}✔ Node.js LTS v$(node -v) is now activated via NVM!${NC}"
}

install_via_nodesource() {
    echo -e "\n${YELLOW}⏳ Installing Node.js LTS v$TARGET_LTS using NodeSource on Debian/Ubuntu...${NC}"
    
    # Configure Debian to be fully non-interactive
    export DEBIAN_FRONTEND=noninteractive
    APT_OPTIONS="-y -o Dpkg::Options::=\"--force-confold\""

    # Verify curl is available
    if ! command -v curl &> /dev/null; then
        echo -e "⏳ Installing curl dependency..."
        apt-get update && apt-get install $APT_OPTIONS curl gnupg
    fi

    # Run NodeSource setup script for Node.js 22 LTS
    echo -e "⏳ Fetching NodeSource setup binary for v$TARGET_LTS..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    
    echo -e "⏳ Installing nodejs package..."
    apt-get install $APT_OPTIONS nodejs
    
    echo -e "${GREEN}✔ Node.js LTS successfully updated! Current: $(node -v)${NC}"
}

case "$OS_TYPE" in
    Linux*)
        # Detect if we have apt (Debian/Ubuntu) or are running inside container
        if [ -f /etc/debian_version ] || [ -f /etc/lsb-release ]; then
            # If running as root (e.g., inside container during custom setup)
            if [ "$EUID" -eq 0 ]; then
                install_via_nodesource
            else
                echo -e "${YELLOW}ℹ Not running as root. Defaulting to safe user-level NVM installation...${NC}"
                install_via_nvm
            fi
        else
            # Non-debian Linux (RedHat, Alpine, etc.) -> default to NVM
            install_via_nvm
        fi
        ;;
    Darwin*)
        echo -e "${GREEN}✔ macOS detected!${NC}"
        if command -v brew &> /dev/null; then
            echo -e "⏳ Installing latest Node.js LTS v$TARGET_LTS via Homebrew..."
            brew install node@22
            brew link --overwrite node@22
        else
            install_via_nvm
        fi
        ;;
    *)
        # Fallback to NVM for all other systems
        install_via_nvm
        ;;
esac

echo -e "\n${CYAN}${BOLD}===================================================================${NC}"
echo -e "${GREEN}${BOLD}🎉 Node.js LTS Configured! Current Environment Status:${NC}"
echo -e "  • Node Version: ${CYAN}$(node -v)${NC}"
echo -e "  • npm Version:  ${CYAN}$(npm -v)${NC}"
echo -e "${CYAN}${BOLD}===================================================================${NC}\n"
