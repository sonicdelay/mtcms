# Engineering Studio lokale Einrichtung

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
git clone https://gitlab-dev.psenterprise.com/gdap/engineering-studio-platform.git
```

Danach sollte deine ./git/config nach dem Klonen ungefähr so aussehen:

---

## Grundlegende Einrichtung für das lokale System (Windows)

Gehe in den Ordner, in den du den Code geklont hast, zum Beispiel:

```bash
cd  C:\localhost\DIPASW-APOI\gDAP\engineering-studio-platform\
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

## Skripte zum Testen

Engineering Studio hat folgende Test-Skripte:
```json
    "e2e:build": "npm run build --workspace end-to-end-test-framework",
    "e2e:check": "npm run check --workspace end-to-end-test-framework",
    "e2e:clean-json-macro": "python ./packages/engineering-studio-developer-tools/end-to-end-test-framework/packages/end-to-end-test-framework/source/helpers/clean_json_macro.py",
    "e2e:debug": "set IS_DEV=1 && wait-on dist/main.js && node packages/engineering-studio-framework/engineering-studio/engineering-studio-cli/engineering-studio-cli.js",
    "e2e:describe-macros": "python ./packages/engineering-studio-developer-tools/end-to-end-test-framework/packages/end-to-end-test-framework/source/helpers/describe_macros.py",
    "e2e:gdap": "set IS_DEV=1 && wait-on dist/main.js && node packages/engineering-studio-framework/engineering-studio/engineering-studio-cli/engineering-studio-cli.js --app Gdap --path gdap --debug 1025",
    "e2e:play-macro": "python ./packages/engineering-studio-developer-tools/end-to-end-test-framework/packages/end-to-end-test-framework/source/main.py",
    "e2e:reset-event-id": "python ./packages/engineering-studio-developer-tools/end-to-end-test-framework/packages/end-to-end-test-framework/source/helpers/reset_event_ids.py",

    "electron:test:gnlmpc": "set IS_TEST=1 && electron dist/main.js --app gnlmpc",

    "storybook:build": "storybook build",
    "storybook:ci:deprecated": "concurrently -k -s first -n \"SB,TEST\" -c \"magenta,blue\" \"npm run storybook:build --quiet && npx http-server storybook-static --port 6006 --silent\" \"wait-on tcp:127.0.0.1:6006 && npm run storybook:test\"",
    "storybook:ci": "concurrently -k -s first -n \"SB,TEST\" -c \"magenta,blue\" \"npm run storybook:dev:ci\" \"wait-on --delay=30000 tcp:127.0.0.1:6006 && npm run storybook:test\"",
    "storybook:debug": "test-storybook --maxWorkers=2 --watch --verbose",
    "storybook:dev:ci": "storybook dev -p 6006 --ci",
    "storybook:test": "test-storybook --testTimeout=100000 --maxWorkers=2 --ci --disable-telemetry",
    "storybook:test:filter": "test-storybook --testTimeout=100000 --maxWorkers=2 --ci --disable-telemetry -- --testPathPattern",
    "storybook": "storybook dev -p 6006 --no-open",

    "test:ci": "node --expose-gc --experimental-vm-modules node_modules/jest/bin/jest.js --silent --logHeapUsage --testPathIgnorePatterns (/__tests__/.*.integration.spec.js /__tests__/.*.sequential.spec.js)",
    "test:integration": "node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --config jest.integration.config.js",
    "test:rpc": "node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --testPathPattern /__tests__/.*grpc-client-test-runner.*.integration.spec.js --config jest.integration.config.js",
    "test:autorun": "node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --testPathPattern /__tests__/.*generate-submodels.integration.spec.js --config jest.integration.config.js",
    "test:sequential": "node --experimental-vm-modules node_modules/jest/bin/jest.js --runInBand --config jest.sequential.config.js",
    "test": "node --expose-gc --experimental-vm-modules node_modules/jest/bin/jest.js --silent --runInBand --logHeapUsage --testPathIgnorePatterns /__tests__/.*.integration.spec.js",
    test:
```



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
packages\engineering-studio-developer-tools\end-to-end-test-framework\packages\end-to-end-test-framework\source\
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
`packages\engineering-studio-developer-tools\end-to-end-test-framework\packages\end-to-end-test-framework\source\helpers\reset_event_ids.py`

Führe dann Folgendes aus:

```bash
python reset_event_ids.py \macros\configuration\test-connections-panels.json
```



## Integrationstests

Siehe Wiki: 
https://gitlab-dev.psenterprise.com/gdap/engineering-studio-platform/-/wikis/Integration-Tests

Dieses Backend wird für Integrationstests benötigt:
https://nexus.psenterprise.com/repository/gdap-installers/gNLMPC_EKF/gNLMPC_EKF_v2026.1.0-win64_vc17-offline-PR-10050-2026-03-12T13-15-53.zip

Integrationstest-Dateien enden mit "*integratio .spec.js"




 npm run test:integration -p "deploy-manager"
