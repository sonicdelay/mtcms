# Inventar

## Option 1: Lambda manuell über die AWS-Web-Konsole aktualisieren

- Wechsle in das Verzeichnis der main.go-Datei der jeweiligen Lambda.

- Baue die Lambda mit dem folgenden Befehl:

  ```
  GOOS=linux GOARCH=arm64 go build -o bootstrap
  ```

- Packe den Build mit dem folgenden Befehl in ein Zip:

  ```
  zip lambda.zip bootstrap
  ```

- Öffne die AWS Management Console über
  [AWS-Zugangsdaten - https://aws.example.cloud](https://aws.example.cloud/#/)
  und navigiere zu AWS Lambda.

Klicke auf die Funktion, die du aktualisieren möchtest.

Wähle im Tab „Code" die Option „Upload from" und wähle die Zip-Datei.

Klicke auf „Save".

Da das API Gateway immer auf die Lambda-Version zeigt, die mit dem Alias
„released" gekennzeichnet ist, musst du im Tab „Versions" eine neue Version
veröffentlichen.

Gehe zurück zur Funktion und bearbeite den Alias unter „Aliases".

Setze die Version des Aliases auf die neu veröffentlichte Version.

Jetzt zeigt das API Gateway auf deine aktualisierte Lambda-Funktion, und du
kannst deinen Endpoint testen.

Du kannst diesen Vorgang so oft durchführen, wie du möchtest. Wenn deine
Änderungen gut sind, schiebe sie auf deinen Branch, dann aktualisiert die
Pipeline automatisch alles.

## Option 2: Lambda per Skript mit AWS CLI aktualisieren

### Voraussetzungen:

AWS CLI installiert und mit den nötigen Berechtigungen von AWS TVM eingerichtet.
Golang installiert

Führe den folgenden Befehl aus, um eine einzelne Lambda-Funktion zu
aktualisieren:

```
.helper/update_lambda.sh <lambda_function_path> <lambda_function_name> <alias>
```

# Beispiel:

```
.helper/update_lambda.sh ./cmd/inventoryupdates feat-ddtrace-ote-inventory-updates released
```
