current_branch := shell("git branch --show-current")

[group('build')]
build:
    bun run build.ts

[group('lint')]
lint:
    bunx biome lint --fix --unsafe .

[group('lint')]
fmt:
    bunx biome format --fix .

[group('git')]
switch:
    if [ {{ current_branch }} != "master" ]; then \
      git switch master; \
      git fetch -p; \
      git branch -D {{ current_branch }}; \
    fi
