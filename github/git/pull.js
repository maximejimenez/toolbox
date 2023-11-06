const path = require('path');
const simpleGit = require('simple-git');

const git = simpleGit();

const DEFAULT_ORIGIN = 'origin';
// By default, GitHub names the default branch main in any new repository.
const DEFAULT_BRANCH = 'main';

const findDefaultOriginAndBranch = async () => {
  // Answers in the form of `origin/branch`
  const gitSymbolicCmd = await git.raw(
    'symbolic-ref',
    '--short',
    'refs/remotes/origin/HEAD',
  );

  const [
    origin = DEFAULT_ORIGIN,
    branch = DEFAULT_BRANCH,
  ] = gitSymbolicCmd.trim().split('/');

  return { origin, branch };
};

async function pull({ target, repository }) {
  const repositoryPath = path.resolve(target, repository);

  await git.cwd(repositoryPath).fetch();
  const status = await git.cwd(repositoryPath).status();
  const isClean = status.isClean();

  const { origin, branch } = await findDefaultOriginAndBranch();

  if (!isClean) {
    throw new Error(`The copy is not clean: ${repositoryPath}`);
  }

  const isDefaultBranchCheckedOut = status.current === branch;
  if (!isDefaultBranchCheckedOut) {
    throw new Error(
      `The repo is currently not on the default branch (${branch}): ${repositoryPath}`,
    );
  }

  if (status.ahead !== 0) {
    throw new Error(`The branch is ahead of its remote: ${repositoryPath}`);
  }

  if (status.behind > 0) {
    await git.cwd(repositoryPath).pull(origin, branch, { '--no-rebase': null });
  }
}

module.exports = pull;
