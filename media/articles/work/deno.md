---
title: Deno,
published_at: 2024-04-30,
snippet: So richtest du Deno und ein Startprojekt ein,
---

# Deno [^](/articles/)

[https://deno.land/](https://deno.land/)

## Installation

Neueste:
[https://github.com/denoland/deno_install](https://github.com/denoland/deno_install)

```bash
curl -fsSL https://deno.land/install.sh | sh
  (Windows: irm https://deno.land/install.ps1 | iex)

export PATH="/home/username/.deno/bin:$PATHD"

deno --version
```

z. B.:

```
deno 2.3.7 (stable, release, x86_64-pc-windows-msvc)
v8 13.7.152.6-rusty
typescript 5.8.3
```

Für weitere Informationen führe Folgendes aus:

```bash
>>$ deno --help
-------------------
Deno: A modern JavaScript and TypeScript runtime

Usage: deno [OPTIONS] [COMMAND]

Commands:
  Execution:
    run          Run a JavaScript or TypeScript program, or a task
                  deno run main.ts  |  deno run --allow-net=google.com main.ts  |  deno main.ts
    serve        Run a server
                  deno serve main.ts
    task         Run a task defined in the configuration file
                  deno task dev
    repl         Start an interactive Read-Eval-Print Loop (REPL) for Deno
    eval         Evaluate a script from the command line

  Dependency management:
    add          Add dependencies
                  deno add jsr:@std/assert  |  deno add npm:express
    install      Installs dependencies either in the local project or globally to a bin directory
    uninstall    Uninstalls a dependency or an executable script in the installation root's bin directory
    outdated     Find and update outdated dependencies
    remove       Remove dependencies from the configuration file

  Tooling:
    bench        Run benchmarks
                  deno bench bench.ts
    check        Type-check the dependencies
    clean        Remove the cache directory
    compile      Compile the script into a self contained executable
                  deno compile main.ts  |  deno compile --target=x86_64-unknown-linux-gnu
    coverage     Print coverage reports
    doc          Generate and show documentation for a module or built-ins
                  deno doc  |  deno doc --json  |  deno doc --html mod.ts
    fmt          Format source files
                  deno fmt  |  deno fmt main.ts
    info         Show info about cache or info related to source file
    jupyter      Deno kernel for Jupyter notebooks
    lint         Lint source files
    init         Initialize a new project
    test         Run tests
                  deno test  |  deno test test.ts
    publish      Publish the current working directory's package or workspace
    upgrade      Upgrade deno executable to given version
                  deno upgrade  |  deno upgrade 1.45.0  |  deno upgrade canary


Environment variables:
Docs: https://docs.deno.com/go/env-vars

  DENO_AUTH_TOKENS      A semi-colon separated list of bearer tokens and hostnames
                         to use when fetching remote modules from private repositories
                          (e.g. "abcde12345@deno.land;54321edcba@github.com")
  DENO_CERT              Load certificate authorities from PEM encoded file
  DENO_DIR               Set the cache directory
  DENO_INSTALL_ROOT      Set deno install's output directory
                          (defaults to $HOME/.deno/bin)
  DENO_NO_PACKAGE_JSON   Disables auto-resolution of package.json
  DENO_NO_UPDATE_CHECK   Set to disable checking if a newer Deno version is available
  DENO_TLS_CA_STORE      Comma-separated list of order dependent certificate stores.
  DENO_TRACE_PERMISSIONS Environmental variable to enable stack traces in permission prompts.
                         Possible values: "system", "mozilla".
                          (defaults to "mozilla")
  HTTP_PROXY             Proxy address for HTTP requests
                          (module downloads, fetch)
  HTTPS_PROXY            Proxy address for HTTPS requests
                          (module downloads, fetch)
  NO_COLOR               Set to disable color
  NO_PROXY               Comma-separated list of hosts which do not use a proxy
                          (module downloads, fetch)
  NPM_CONFIG_REGISTRY    URL to use for the npm registry.

Docs: https://docs.deno.com
Standard Library: https://jsr.io/@std
Bugs: https://github.com/denoland/deno/issues
Discord: https://discord.gg/deno
```
