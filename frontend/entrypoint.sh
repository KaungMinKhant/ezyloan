#!/bin/sh

# Replace environment variables in JavaScript files
for file in /usr/share/nginx/html/*.js; do
  echo "Processing $file ..."
  envsubst '${VITE_BACKEND_URL}' < "$file" > "${file}.temp"
  mv "${file}.temp" "$file"
done

# Start Nginx
nginx -g 'daemon off;'
