### Redis-Cluster Proxy setup
This directory contains the binary and the sample config for running Envoy Proxy as Redis-Cluster Proxy.
> Note this binary is for Fedora-28 x86.

Copy the `sample.envoy.yaml` to `envoy.yaml` and update the `cluster` section with all the Redis nodes and the password.

Then run the proxy with the below command
```sh
LD_LIBRARY_PATH=$(pwd)/bin ./bin/envoy --config-yaml ./envoy.yaml
```
