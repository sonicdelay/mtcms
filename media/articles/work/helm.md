# Helm [^](..)

```bash
git clone git@code.example.com:codema/utils/helm-charts/codema.git
git checkout integration
cd codema
```

## Install charts

```bash
helm install test ./charts/codema -n app --values ./charts/codema/values-k3d-traefik.yaml --dependency-update
```

## Troubleshooting

```bash
git checkout integration
helm list -n app
helm uninstall test -n app
helm install test ./charts/codema -n app --values ./charts/codema/values-k3d-traefik.yaml --dependency-update
```

## Up and running

```bash
kubectl get all -A -o wide
```
