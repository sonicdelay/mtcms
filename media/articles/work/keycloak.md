# KEYCLOAK [^](/articles/)

## Entwicklungsumgebung für KeyCloak einrichten

### Schritt-für-Schritt-Anleitung

Du musst folgende Schritte ausführen:

1. Kloone das Repository: https://code.#######.com/codema/iam/Keycloak
2. Wie in der Readme-Datei im Repository beschrieben, führe den Befehl in der
   gitbash/Shell aus: sh replace-root-url.sh http://localhost:4200
3. Lege die docker-compose-Datei in den Ordner, in dem Keycloak geklont ist.
   Die Image-Tag-Version kannst du bei Bedarf ändern. docker-compose.yml
4. Führe docker compose up in der Eingabeaufforderung aus.
5. Sobald der Container läuft, öffne http://localhost:8080.
6. Die Startseite von Keycloak: siehe PDF
7. Gehe zur Administration Console und gib Benutzername und Passwort „admin"
   ein.
8. Klicke auf Realm und erstelle ein neues Realm
9. REALM: siehe PDF
10. Wähle die Datei: <path-to-repository>/realm-config/###-realm.json.
11. Klicke auf create (siehe PDF) mit: Resource file >> ###-realm.json,
    Realm name = ###, Enabled = ON
12. Wähle das „###"-Realm, denn standardmäßig ist Master ausgewählt.
13. Füge einen Benutzer für das Realm ### hinzu.
14. Zeige die neuen Benutzer an
15. Erstelle einen Benutzer wie im Beispiel: Email = test@test.com,
    First name = test, Last name = test
16. Sobald der Benutzer erstellt ist, füge die Passwort-Zugangsdaten hinzu.
17. Setze das Passwort wie im Beispiel: „test".
18. Führe nun die API aus, um den Access Token zu bekommen, zum Beispiel
    (curl -X POST -d "client_id=###" -d "username=test@test.com" -d
    "password=test" -d "grant_type=password"
    localhost:8080/realms/###/protocol/openid-connect/token)
19. In der API sind die Parameter wie folgt: curl -X POST -d
    "client_id=<client>" -d "username=<username>" -d "password=<password>" -d
    "grant_type=password"
    localhost:8080/realms/<realm>/protocol/openid-connect/token

---

S ID Keycloak prüft Token und leitet Anfragen mit Token im Auth-Header weiter
API Gateway Anfragen mit Token im Auth-Header UI oder anderer Client Daten für
Tenant abfragen Cloud-Services-Datenbank Token holen Anfragen mit Token im
Auth-Header Discovery-Agent als Identity Provider verwenden Token holen
Tenant-Informationen aus dem Token lesen

Auth-Server = keycloak

Statt einen eigenen internen/externen Identity Provider zu nutzen, wird S ID
mit keycloak als Identity Provider integriert.

---

## UI oder Web-Client (Browser):

- Der Benutzer öffnet die ###-UI
- Der Benutzer wird zur keycloak-Loginseite weitergeleitet
- Der Benutzer gibt seine Zugangsdaten ein.
- Wenn die Anmeldung erfolgreich ist, erhält der Client einen Access Token und
  wird zur ###-UI weitergeleitet.
- Alle weiteren Anfragen an die Anwendung müssen diesen Access Token enthalten.
- Wenn das API Gateway eine Anfrage erhält, prüft es den Token über den
  keycloak-Introspect-Token-Endpoint.
- Wenn der Token gültig ist, wird die Anfrage an die nachgelagerten
  (Cloud-)Services weitergeleitet, sonst wird sie mit Status 401 abgelehnt.
- (Wie der Access Token verwaltet wird, hängt ganz davon ab, wie ein Entwickler
  die Logik zum Speichern und Nutzen des Tokens umgesetzt hat)

## Webserver (Backend-Service):

- Die App fragt einen Authorization Code beim keycloak-Auth-Endpoint an
  (grant type: auth)
- Die App erhält den Auth Code
- Die App fragt den Access Token beim keycloak-Token-Endpoint an, mit dem
  erzeugten Auth Code und den Zugangsdaten
- Die App erhält einen Access Token und einen Refresh Token
- Alle weiteren Anfragen an das API Gateway müssen diesen Access Token
  enthalten.
- Wenn das API Gateway eine Anfrage erhält, prüft es den Token über den
  keycloak-Introspect-Token-Endpoint.
- Wenn der Token gültig ist, wird die Anfrage an die nachgelagerten
  (Cloud-)Services weitergeleitet, sonst wird sie mit Status 401 abgelehnt.
- Der Access Token hat eine begrenzte, fest eingestellte Gültigkeitsdauer.
- Wenn ein Access Token abläuft, kann der Refresh Token genutzt werden, um
  einen neuen Access Token zu bekommen, ohne einen neuen Auth Code zu erzeugen.
