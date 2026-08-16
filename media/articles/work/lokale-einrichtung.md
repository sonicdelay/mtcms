# ES lokale Einrichtung

## Zugriff bekommen

Über deinen LDAP-Benutzer solltest du diese Werkzeuge zur Verfügung haben:

* Gitlab - Code
* Nexus - Backend-Repository
* Jenkins - Pipeline-Ergebnisse und Artefakte

## GIT einrichten

Installiere GIT und füge die Konfiguration wie folgt hinzu (mit Extras, aber nicht global):

```
git config --global pull.rebase true
git config --global fetch.prune true
git config --global diff.colorMoved zebra
```
Siehe: https://spin.atomicobject.com/git-configurations-default/


```
git clone https://gitlab-dev.example.com/gdap/es-platform.git
```

Danach sollte deine ./git/config nach dem Klonen ungefähr so aussehen:

---

## Grundlegende Einrichtung für das lokale System (Windows)

Gehe in den Ordner, in den du den Code geklont hast, zum Beispiel:

```bash
cd  C:\localhost\DIPASW-APOI\gDAP\es-platform\
```

Starte 2 Terminals im Projektordner. Im ersten Terminal führe Folgendes aus:

```bash
npm run serve
```

und im zweiten Terminal (prüfe deinen Anwendungsfall [gdap/...]):

```bash
npm run app:gdap
```
---

# Testen


## Unit-Tests

```
npm run test
```

...todo

## Storybook-Tests

Starte 3 Terminals im Projektordner

```bash
npm run serve
```

and

```bash
npm run app:gdap
```

Starte die Tests:

```bash
 npm run storybook
```

Dann öffne -> [http://localhost:6006](http://localhost:6006)

oder für die Kommandozeile (CLI):

```bash
 npm run storybook:test
```

---

## E2E-Tests mit Python und Makros

Starte 2 Terminals im Projektordner (für den freigegebenen Debug-Port):

```bash
npm run serve
```

and

```bash
npm run e2e:gdap
```

Wechsle dann in diesen Ordner:

```bash
packages\es-developer-tools\e2e-test-framework\packages\end-to-end-test-framework\source\
```

### Kompletter Testlauf

```bash
python  main.py --run_app 0
```

oder für ein einzelnes Test-Makro, zum Beispiel:

```bash
python  main.py --run_app 0 --run_only="*test-select-variables"
```

### Test-Runner stoppen
Drücke `CTRL+F9`

### Hilfsfunktionen

So bekommst du den Pfad eines angeklickten Browser-Elements:
```javascript
esx.macros.track()
```




## Makros

### Makros aufnehmen

Im Entwicklermodus öffnest du die Entwicklerwerkzeuge und tippst in die Konsole:

Zum Starten der Aufnahme:
```javascript
esx.macros.record('name-of-macro')
```

Zum Stoppen der Aufnahme:
```javascript
esx.macros.stop()
```

Zum Kopieren der aufgenommenen Ereignisse in die Zwischenablage:
```javascript
esx.macros.toE2E()
```

### Hilfe-Menü

```javascript
esx.macros.help()
```

zeigt:

| Shortcut      | Command                   | Beschreibung                                                  |
|---------------|---------------------------|---------------------------------------------------------------|
| ctrl+a        | Alles auswählen           | Wählt den gesamten Text im fokussierten Element aus           |
| ctrl+alt+c    | Checkpoint hinzufügen     | Fügt einen Checkpoint an der aktuellen Mausposition hinzu     |
| ctrl+alt+e    | Warte-Element hinzufügen  | Wartet, bis ein Element im DOM erscheint                      |
| ctrl+alt+f    | Text finden               | Findet Text im Element unter der Maus                         |
| ctrl+alt+t    | Text im Panel finden      | Findet Text in jedem Element des Panels unter der Maus        |
| ctrl+alt+h    | Aufnahme pausieren/weiter | Pausiert oder setzt die Makro-Aufnahme fort                   |
| ctrl+alt+j    | JavaScript-Snippet hinzufügen | Fügt ein JavaScript-Snippet hinzu, das ausgeführt wird     |
| ctrl+alt+m    | Makro ausführen           | Führt ein Makro aus                                           |
| ctrl+alt+n    | Neues Makro               | Startet eine neue Makro-Aufnahme                              |
| ctrl+alt+o    | Mouse Over hinzufügen     | Fügt ein Mouse-Over-Ereignis an der aktuellen Mausposition hinzu |
| ctrl+alt+w    | Wartezeit hinzufügen      | Wartet eine bestimmte Zeit (in Millisekunden)                 |
| ctrl+alt+x    | XPath in Zwischenablage kopieren | Kopiert den XPath des Elements unter der Maus in die Zwischenablage |


### IDs in Makro-Dateien automatisch neu berechnen

Die Makros findest du unter /macros. Jeder Test hat eine Nummer (eine id) .... Damit du nicht alles neu nummerieren musst, kannst du dieses Python-Skript verwenden: 
`packages\es-developer-tools\end-to-end-test-framework\packages\e2e-test-framework\source\helpers\reset_event_ids.py`

Führe dann Folgendes aus:

```bash
python reset_event_ids.py \macros\configuration\test-connections-panels.json
```



## Integrationstests

Siehe Wiki: 
https://gitlab-dev.example.com/gdap/es-platform/-/wikis/Integration-Tests

Dieses Backend wird für Integrationstests benötigt:
https://nexus.example.com/repository/gdap-installers/gNLMPC_EKF/gNLMPC_EKF_v2026.1.0-win64_vc17-offline-PR-10050-2026-03-12T13-15-53.zip

Integrationstest-Dateien enden mit "*integratio .spec.js"




 npm run test:integration -p "deploy-manager"
