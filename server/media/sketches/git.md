# Git

See [https://git-scm.com/](https://git-scm.com/) for details.

## Schritte für einen Rebase:

So führst du einen Rebase durch.

0. Erstelle bei Bedarf ein Backup des Branches

   ```
   git switch -c <feature_branch_name>-rebase
   ```

1. Aktualisiere den main-Branch (ohne zu main zu wechseln) (hole die Commits
   von main in den feature-Branch)

   ```
   git fetch origin
   ```

2. Rebase durchführen

   ```
   git rebase origin/main
   ```

   => Es gibt keine Änderungen („Current branch ###-XYZ is up to date"). **Fertig**

   => Änderungen wurden übernommen (keine Konflikte: „Successfully rebased and
   updated refs/head/..."). **Weiter mit 5.**

   => Es gibt Konflikte, **weiter mit 3**.

3. Löse die Konflikte in VSCode und füge dann die Dateien hinzu

   ```
   git add .
   ```
4. Setze den Rebase fort (nur wenn es Konflikte gab)

   ```
   git rebase --continue
   ```

5. Schiebe alles direkt hoch

   ```
   git push origin HEAD --force
   ```

## Projekt starten

### Git global einrichten

```bash
git config --global user.name "John Doe"
git config --global user.email "john.doe@example.com"
```

### Ein neues Repository erstellen

```bash
git clone git@code.example.com:sascha.hess/energy-customer-portal.git
cd energy-customer-portal
git switch -c main
touch README.md
git add README.md
git commit -m "add README"
git push -u origin main
```

### Einen vorhandenen Ordner hochladen

```bash
cd existing_folder
git init --initial-branch=main
git remote add origin git@code.example.com:sascha.hess/energy-customer-portal.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Ein vorhandenes Git-Repository hochladen

```bash
cd existing_repo
git remote rename origin old-origin
git remote add origin git@code.example.com:sascha.hess/energy-customer-portal.git
git push -u origin --all
git push -u origin --tags
```

## Gute Commit-Gewohnheiten

```bash
git pull --rebase

git switch feature-branch
git rebase -i main
git switch main
git merge feature-branch
git branch -d feature-branch
```

## Komplette History löschen

```bash
git checkout --orphan latest_branch
git add -A
git commit -am "commit message"
git branch -D main
git branch -m main
git push -f origin main
```

## Checkout

```bash
(git commit -a -m "Backup.")
(git branch my-backup)
git fetch origin
git reset --hard origin/main
```
