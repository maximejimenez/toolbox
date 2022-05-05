const path = require('path');
const simpleGit = require('simple-git');

const ORIGIN = 'origin';
const MASTER = 'master';
const MAIN = 'main';

const git = simpleGit();

module.exports = async function pull({ target, repository }) {
  const repositoryPath = path.resolve(target, repository);

  try {
    await git.cwd(repositoryPath).fetch();

    const status = await git.cwd(repositoryPath).status();
    const isClean = status.isClean();
    const isMasterCheckedOut = status.current === MASTER || MAIN;

    if (!isClean) {
      throw new Error(`The copy is not clean: ${repositoryPath}`);
    }

    if (!isMasterCheckedOut) {
      throw new Error(`The repo is not currently on master: ${repositoryPath}`);
    }

    if (status.ahead !== 0) {
      throw new Error(
        `The branch is ahead compared to remote: ${repositoryPath}`,
      );
    }

    if (status.behind > 0) {
      await git
        .cwd(repositoryPath)
        .pull(ORIGIN, MASTER, { '--no-rebase': null });
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: repository,
    };
  }
};
