#!/bin/bash
WEBHOOK_CALL=""

if [ "$WEBHOOK_CALL" != "" ]; then
    PACKAGE_VERSION=$(cat package.json | grep appVersion | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g')
    PACKAGE_NAME=$(cat package.json | grep name | head -1 | awk -F: '{ print $2 }' | sed 's/[",]//g')
    SERVER_NAME=$(ls /etc/nginx/sites-available)
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    
    curl --location --request POST $WEBHOOK_CALL \
    --header 'Content-Type: application/json' \
    --data-raw "{
        \"text\" : \"🚀🚀🚀 $SERVER_NAME 🔀$GIT_BRANCH 📦$PACKAGE_NAME📍$PACKAGE_VERSION \"
    }"
fi