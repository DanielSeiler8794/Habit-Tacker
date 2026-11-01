#!/bin/sh
# Builds the app and publishes dist/ to the gh-pages branch, which GitHub Pages serves.
set -e
cd "$(dirname "$0")/.."

npm run build
touch dist/.nojekyll

tmp=$(mktemp -d)
git worktree add --detach "$tmp" >/dev/null
cd "$tmp"
git checkout --orphan gh-pages-new >/dev/null 2>&1
git rm -rf -q . >/dev/null 2>&1 || true
cp -R "$OLDPWD/dist/." .
git add -A
git commit -q -m "Deploy $(git -C "$OLDPWD" rev-parse --short HEAD)"
git push -q -f origin HEAD:gh-pages
cd "$OLDPWD"
git worktree remove --force "$tmp"
git branch -D gh-pages-new >/dev/null 2>&1 || true
echo "Published to https://danielseiler8794.github.io/habit-tracker/"
