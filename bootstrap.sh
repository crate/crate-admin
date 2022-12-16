#!/bin/sh

# Install Node.js sandbox.
export NODEJS_VERSION=18.12.1
export NPM_VERSION=8.19.3
source /dev/stdin <<<"$(curl -s https://raw.githubusercontent.com/cicerops/supernode/main/supernode)"

# Install dependencies.
npm install
