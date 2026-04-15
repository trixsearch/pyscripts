#!/bin/bash
DOCKER_NAME=onboard_frontend
if [ -z "$1" ]
then
  echo -e "Usage: \n${0##*/} build \n${0##*/} start \n${0##*/} stop \n${0##*/} info \n${0##*/} rm"
  exit 1
fi

if [ $1 == build ]
then
  docker build -t "$DOCKER_NAME" .
  STATUS=$?
  if [ $STATUS -eq 0 ]
  then
    echo -e "\nContainer is built"
  else
    echo -e "\nFailed building containers"
  fi
elif [ $1 == start ]
then
  docker run -d -it -p 80:80/tcp --name="$DOCKER_NAME" "$DOCKER_NAME"
  STATUS=$?
  if [ $STATUS -eq 0 ]
  then
    echo -e "\nContainers starting in background \nFor log info: ${0##*/} info"
  else
    echo -e "\nFailed starting containers"
  fi
elif [ $1 == rm ]
then
  docker rmi "$DOCKER_NAME"
  STATUS=$?
  if [ $STATUS -eq 0 ]
  then
    echo -e "\nContainer is removed"
  else
    echo -e "\nFailed removing containers"
  fi
elif [ $1 == stop ]
then
  docker stop "$DOCKER_NAME"
  docker rm "$DOCKER_NAME"
  STATUS=$?
  if [ $STATUS -eq 0 ]
  then
    echo -e "\nContainers successfully stopped"
  else
    echo -e "\nFailed stopping containers"
  fi
elif [ $1 == info ]
then
  docker logs -f  "$DOCKER_NAME"
else
  echo -e "Usage: \n${0##*/} build \n${0##*/} start \n${0##*/} stop \n${0##*/} info \n${0##*/} rm"
  exit 1
fi
