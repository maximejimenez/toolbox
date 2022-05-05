const simpleGit = require('simple-git');
const path = require('path');
const mkdirp = require('mkdirp');

const git = simpleGit();

module.exports = async function close({ destination, repository }) {
  try {
    const { fullName, sshUrl } = repository;
    const repositoryPath = path.resolve(destination, fullName);

    await mkdirp(repositoryPath);
    await git.clone(sshUrl, repositoryPath);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: `${repository}: ${error.message}`,
    };
  }
};
