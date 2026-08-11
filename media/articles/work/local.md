# Engineering Studio Local Setup 

## Get Access

The following tools should be available to you via LDAP user

* Gitlab - Code
* Nexus - Backend Repository
* Jenkins - Pipeline results and artifacts

## Setup GIT

Install GIT and add configuration like (with extras not global):

```
git config --global pull.rebase true
git config --global fetch.prune true
git config --global diff.colorMoved zebra
```
See: https://spin.atomicobject.com/git-configurations-default/


```
git clone https://gitlab-dev.psenterprise.com/gdap/engineering-studio-platform.git
```

This should end with a version of ./git/config after cloning like:

---

## Basic Setup To Run On Local System (Windows)

Go to the folder you cloned the code e.g.:

```bash
cd  C:\localhost\DIPASW-APOI\gDAP\engineering-studio-platform\
```

Start 2 terminal in prioject root folder. In the first run:

```bash
npm run serve
```

and in the second (check your usecase [gdap/...]):

```bash
npm run app:gdap
```
---

# Testing

## Scrips for testing

Engineering Studio has the following test scripts
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



## Unit Testing

```
npm run test
```

...todo

## Storybook Testing

Start 3 terminal in prioject root folder

```bash
npm run serve
```

and

```bash
npm run app:gdap
```

Start testing

```bash
 npm run storybook
```

Then navigate to -> [http://localhost:6006](http://localhost:6006)

or for CLI

```bash
 npm run storybook:test
```

---

## E2E Testing with Python & Macros

In project root folder for exposed debug port start 2 terminals:

```bash
npm run serve
```

and

```bash
npm run e2e:gdap
```

Then switch to the following folder:

```bash
packages\engineering-studio-developer-tools\end-to-end-test-framework\packages\end-to-end-test-framework\source\
```

### Full test run

```bash
python  main.py --run_app 0
```

or for a single test macro e.g.:

```bash
python  main.py --run_app 0 --run_only="*test-select-variables"
```

### Stop Test runner
Press `CTRL+F9`

### Helper functions

To get path of clicked Browser element
```javascript
esx.macros.track()
```




## Macros

### Record Macros

In developer mode start developer tools type in the console:

To start recording
```javascript
esx.macros.record('name-of-macro')
```

To stop recording
```javascript
esx.macros.stop()
```

To copy recorded events to clipboard
```javascript
esx.macros.toE2E()
```

### Help menu

```javascript
esx.macros.help()
```

shows:

| Shortcut      | Command                   | Description                                               |
|---------------|---------------------------|-----------------------------------------------------------|
| ctrl+a        | Select All                | Select all text in the focused element                    |
| ctrl+alt+c    | Add Checkpoint            | Add a checkpoint at the current mouse position            |
| ctrl+alt+e    | Add Wait Element          | Add a wait for element to appear in the DOM               |
| ctrl+alt+f    | Find Text                 | Find text in the element under the mouse                  |
| ctrl+alt+t    | Find Text in Panel        | Find text in any element of the panel under the mouse     |
| ctrl+alt+h    | Hold/Resume Recording     | Hold or resume the macro recording                        |
| ctrl+alt+j    | Add JavaScript Snippet    | Add a JavaScript snippet to be executed                   |
| ctrl+alt+m    | Run Macro                 | Run a macro                                               |
| ctrl+alt+n    | New Macro                 | Start a new macro recording                               |
| ctrl+alt+o    | Add Mouse Over            | Add a mouse over event at the current mouse position      |
| ctrl+alt+w    | Add Wait                  | Add a wait for a specific amount of time (milliseconds)   |
| ctrl+alt+x    | Copy XPath to Clipboard   | Copy the XPath of the element under the mouse to clipboard|


### Autocalculate ids in macro files 

Macros can be found under /macros. Each test is numbered with an id .... To not renumber everything you can use the following Python script under 
`packages\engineering-studio-developer-tools\end-to-end-test-framework\packages\end-to-end-test-framework\source\helpers\reset_event_ids.py`

then run:

```bash
python reset_event_ids.py \macros\configuration\test-connections-panels.json
```



## Integration Testing

See wiki: 
https://gitlab-dev.psenterprise.com/gdap/engineering-studio-platform/-/wikis/Integration-Tests

Current Backend needed for integration testing:
https://nexus.psenterprise.com/repository/gdap-installers/gNLMPC_EKF/gNLMPC_EKF_v2026.1.0-win64_vc17-offline-PR-10050-2026-03-12T13-15-53.zip

Interration  test fiels end with "*integratio .spec.js"




 npm run test:integration -p "deploy-manager"
