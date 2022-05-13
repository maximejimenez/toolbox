const simpleGit = require('simple-git');
const path = require('path');
const mkdirp = require('mkdirp');

const git = simpleGit();

async function clone({ destination, repository }) {
  const { fullName, sshUrl } = repository;
  const repositoryPath = path.resolve(destination, fullName);

  await mkdirp(repositoryPath);
  await git.clone(sshUrl, repositoryPath);
}

module.exports = clone;
