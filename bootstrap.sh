#!/bin/sh

# Install Node.js sandbox.
export NODEJS_VERSION=22.10.0
export NPM_VERSION=10.9.0
source /dev/stdin <<<"$(curl -s https://raw.githubusercontent.com/cicerops/supernode/main/supernode)"

# Install dependencies.
npm install
