# AES Media Encrpyt

```
npm init -y
npm install -D typescript tsx @types/node

```
node -e "console.log(crypto.randomBytes(32).toString('hex'))" > secret.key
```

With npm
```
npm run encrypt -- --url "nodejs-icon.svg" --keyfile "secret.key" --out "protected.bin"

npm run decrypt -- --file "protected.bin" --keyfile "secret.key" --out "restored_document.svg"
```

With deno

```
deno run --allow-net --allow-read --allow-write encrypt.ts --file "https://example.com/sample.pdf" --out "protected.bin"

deno run --allow-read --allow-write encrypt.ts --file "./my-local-document.pdf" --out "protected.bin"

deno run --allow-read --allow-write decrypt.ts --file "protected.bin" --keyfile "secret.key" --out "restored.pdf"
```

key can also stored as QRCODE with e.g. https://www.tu-chemnitz.de/urz/apps/qrcode/