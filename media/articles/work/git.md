# Git [^](/articles/)

See [https://git-scm.com/](https://git-scm.com/) for details.

## Steps for a rebase:

These are the steps to take at a rebase.

0. If necessary, create a backup of the branch

   ```
   git switch -c <feature_branch_name>-rebase
   ```

1. Update the main branch (without switching to main) (get commits from main to
   the feature branch)

   ```
   git fetch origin
   ```

2. Rebase

   ```
   git rebase origin/main
   ```

   => There are no changes (“Current branch ###-XYZ is up to date”). **Ready**

   => Changes are incorporated (no conflicts: "Successfully rebased and updated
   refs/head/..."). **Continue with 5.**

   => Conflicts, **Continue with 3**.

3. Resolve conflicts in VSCode, then add files

   ```
   git add .
   ```
4. Continue rebase (only if there were conflicts)

   ```
   git rebase --continue
   ```

5. Push everything directly

   ```
   git push origin HEAD --force
   ```

## Init project

### Git global setup

```bash
git config --global user.name "John Doe"
git config --global user.email "john.doe@example.com"
```

### Create a new repository

```bash
git clone git@code.example.com:sascha.hess/energy-customer-portal.git
cd energy-customer-portal
git switch -c main
touch README.md
git add README.md
git commit -m "add README"
git push -u origin main
```

### Push an existing folder

```bash
cd existing_folder
git init --initial-branch=main
git remote add origin git@code.example.com:sascha.hess/energy-customer-portal.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Push an existing Git repository

```bash
cd existing_repo
git remote rename origin old-origin
git remote add origin git@code.example.com:sascha.hess/energy-customer-portal.git
git push -u origin --all
git push -u origin --tags
```

## Commit Best Practice

```bash
git pull --rebase

git switch feature-branch
git rebase -i main
git switch main
git merge feature-branch
git branch -d feature-branch
```

## Kill all history

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
