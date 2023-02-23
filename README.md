# toolbox

My personnal toolbox

## Install

```
> npm install
```

## Usage

### Git utilities

- Clone all repositories

  ```
    > node github/clone_repositories.js --token <TOKEN> --destination <PATH>
  ```

- Pull all repositories from origin/default-branch (e.g. origin/master, origin/main)

  ```
    > node github/pull_repositories.js --target <PATH>
  ```
