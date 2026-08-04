---
{
  title: Cluster,
  published_at: 2024-04-30,
  snippet: How to setup the K3D cluster used for an internal project,
}
---

# Cluster [^](/articles/)

Setup according to:

- <https://code.example.com/score/dev-tools/wsl2-setup>
- <https://code.example.com/codema/utils/helm-charts/codema/-/blob/integration/docs/LOCAL_DEV.md>

## WSL instance score

### Download artifact v0.0.4 from

- <https://code.example.com/score/dev-tools/wsl2-setup/-/package_files/663778/download>

```shell
expand-archive -path '.\artifacts.zip'
wsl --set-default-version 2
wsl --shutdown
mkdir .\score
wsl --import score .\score .\score.tar.gz
```

```shell
wsl -d score
passwd // (score:score)
```

---

## Store public ssh key for repo access

### Create ssh key

```shell
ssh-keygen -q -t rsa -N ''
```

### Copy public key

```shell
cat /$HOME/.ssh/id_rsa.pub
```

- Paste public key into your gitlab profile
  (<https://code.example.com/-/profile/keys>)

---

## K3d cluster dev

### Create Cluster

```shell
k3d cluster create dev --api-port 6550 -p "8099:80@loadbalancer" --agents 2 --k3s-arg "--no-deploy=traefik@server:*"
```

### Create name space and secrets kubectl create ns app

```shell
kubectl create ns app

kubectl -n app create secret docker-registry group-registry-secret --docker-server=cr.example.com --docker-username=sascha.hess@example.com --docker-password=###-exampleexample######

kubectl patch sa default -n app -p='{"imagePullSecrets": [{"name": "group-registry-secret"}]}'

kubectl -n app create secret generic keycloak-secret --from-literal=keycloak_admin_user=admin --from-literal=keycloak_admin_password=admin
```

### Install kong as ingress controller

```shell
helm repo add kong https://charts.konghq.com
helm repo update
helm install kong kong/kong -n app --set=image.repository=cr.example.com/codema/iam/kong/build/kong --set=image.tag=0.0.1 --set=image.pullSecrets={group-registry-secret} --set=env.plugins="bundled\,oidc"


helm upgrade --install kong kong/kong \
    -n app \
    --version=2.15.3 \
    --set=image.repository=cr.example.com/codema/iam/kong/build/kong \
    --set=image.tag=0.2.4 \
    --set=image.pullSecrets={group-registry-secret} \
    --set=env.plugins="bundled\,codema-auth" \
    --set=env.pluginserver_names="codema-auth" \
    --set=env.pluginserver_codema_auth_query_cmd="/usr/local/bin/codema-auth -dump" \
    --set=env.log_level=debug
```

µµ

### Update Umbrella Charts

```shell
git clone git@code.example.com:codema/utils/helm-charts/codema.git && cd codema
...
git switch -d integration
git pull
```

### Setup Test

```shell
helm registry login cr.example.com --username sascha.####@example.com --password -CSC-exampleexample######
helm dependency update ./charts/codema
helm install test ./charts/codema -n app --values ./charts/codema/values-kong-local.yaml --dependency-update
```

### Verfiy Up&Running

```shell
watch -n 2 kubectl get pods -n app -o=wide
```

### Kill commands

```shell
k3d cluster delete <cluster-name>
helm uninstall -n app <release-name>
kubectl delete pod -n app <pod-name>
```

### gatekeeper local

```shell
kubectl -n app port-forward service/test-wfx-service 8181:8081
kubectl -n app port-forward service/test-postgres 5432:80
go run . -wfx-service-port-north=8181
```
