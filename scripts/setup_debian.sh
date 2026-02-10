#!/bin/bash

# PixelFlow - Setup script for Debian 13 (Trixie) LXC
# Run: sudo bash setup_debian.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting PixelFlow Installation on Debian 13...${NC}"

# Check if root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root${NC}"
  exit
fi

# Update system
echo -e "${GREEN}Updating system packages...${NC}"
apt update && apt upgrade -y

# Install dependencies
echo -e "${GREEN}Installing essential dependencies...${NC}"
apt install -y git curl build-essential gnupg procps

# Install Node.js 22 (Current LTS suggested)
echo -e "${GREEN}Installing Node.js 22...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Install MongoDB 8.0 (Using Bookworm repo as Trixie is testing)
echo -e "${GREEN}Installing MongoDB 8.0...${NC}"
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/8.0 main" | tee /etc/apt/sources.list.d/mongodb-org-8.0.list
apt update
apt install -y mongodb-org || {
  echo -e "${RED}Failed to install mongodb-org, trying fallback...${NC}"
  apt install -y mongodb
}

systemctl enable mongod
systemctl start mongod

# Install PM2
echo -e "${GREEN}Installing PM2 Process Manager...${NC}"
npm install -g pm2

# Final message
echo -e "${GREEN}--------------------------------------------------${NC}"
echo -e "${GREEN}Base Installation Complete!${NC}"
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Clone the repository: git clone https://github.com/flavioGonz/pixelflow.git"
echo -e "2. Enter the directory: cd pixelflow"
echo -e "3. Install project dependencies: npm install"
echo -e "4. Build the project: npm run build"
echo -e "5. Create .env file with your configurations"
echo -e "6. Start with PM2: pm2 start ecosystem.config.js"
echo -e "${GREEN}--------------------------------------------------${NC}"
