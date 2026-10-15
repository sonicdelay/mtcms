# Alpine-basiertes Node.js-Image verwenden
FROM node:24-alpine

# Arbeitsverzeichnis im Container festlegen
WORKDIR /app

# package.json und package-lock.json kopieren
COPY package*.json ./

# Anwendungsabh├ñngigkeiten installieren
RUN npm install

# Restlichen Anwendungsquellcode kopieren
COPY . .

# Port 3000 f├╝r externe Zugriffe freigeben
EXPOSE 4210

# Befehl zum Starten der Anwendung
CMD ["node", "server.js"]
