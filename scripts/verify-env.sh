#!/bin/bash

# Rufflo Command Center - Dependency Environment Verification Script
# Executed automatically as a post-install hook to ensure node version,
# modules, config configurations, and build-readiness match operational parameters.

set -e

# Color codes
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;37m' # No Color
BOLD='\033[1m'

echo -e "${CYAN}${BOLD}===================================================================${NC}"
echo -e "${CYAN}${BOLD}       🔍 SYSTEM ENVIRONMENT & DEPENDENCY VERIFIER (POST-INSTALL)  ${NC}"
echo -e "${CYAN}${BOLD}===================================================================${NC}"

# 1. Verify Node.js Version
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d'.' -f1)

echo -e "Checking Node.js Version..."
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo -e "${RED}❌ Warning: Detected older Node.js version: v$NODE_VERSION${NC}"
    echo -e "${YELLOW}👉 Recommended: Update to Node.js v20 or v22 (LTS)${NC}"
else
    echo -e "${GREEN}✔ Node.js version verified: v$NODE_VERSION (LTS Compatible)${NC}"
fi

# 2. Check essential workspace files
echo -e "\nVerifying workspace files..."
ESSENTIAL_FILES=("package.json" "server.ts" "vite.config.ts" "index.html" "tsconfig.json")
MISSING_FILES=0

for file in "${ESSENTIAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✔ Found: $file${NC}"
    else
        echo -e "  ${RED}❌ Missing critical file: $file${NC}"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

# 3. Environment Config check (.env)
if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo -e "\n${YELLOW}💡 Local .env file not detected. Cloning template from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✔ Created default .env file${NC}"
fi

# 4. Check typescript compiler and linting assets
echo -e "\nVerifying node_modules and compiler readiness..."
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✔ node_modules folder detected.${NC}"
else
    echo -e "${RED}❌ node_modules folder missing. Run 'npm install' to resolve dependencies.${NC}"
    exit 1
fi

echo -e "${CYAN}${BOLD}===================================================================${NC}"
if [ $MISSING_FILES -eq 0 ]; then
    echo -e "${GREEN}${BOLD}🎉 System Environment verification SUCCESSFUL! Workspace ready for deployment.${NC}"
else
    echo -e "${RED}${BOLD}⚠ Setup verification completed with warnings. Please review the missing configurations.${NC}"
fi
echo -e "${CYAN}${BOLD}===================================================================${NC}\n"
