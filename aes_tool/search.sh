for file in data/*; do
  if [[ -f "$file" && "$file" != *.enc ]]; then
    echo "Encrypting $file..."
    # npm run encrypt -- --file "$file" --out "$file.enc"
  fi
done