/* eslint-disable no-await-in-loop */

// Usage: node github/clone_repositories.js --token myToken --destination /my/destination

const cliProgress = require('cli-progress');
const program = require('commander');
const fs = require('fs');
const inquirer = require('inquirer');
const mkdirp = require('mkdirp');
const path = require('path');
const simpleGit = require('simple-git');
const winston = require('winston');
const { Octokit } = require('@octokit/rest');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const git = simpleGit();

const REPOSITORY_TYPE = {
  ALL: 'all',
  MEMBER: 'member',
  OWNER: 'owner',
};

async function cloneRepository(repo, destination) {
  const { fullName, sshUrl } = repo;
  const repositoryPath = path.resolve(destination, fullName);

  await mkdirp(repositoryPath);
  await git.clone(sshUrl, repositoryPath);
}

async function cloneRepositories(token, destination) {
  if (!fs.existsSync(destination) || !fs.lstatSync(destination).isDirectory()) {
    throw new Error(
      `Destination : "${destination}" does not exist or is not a directory`,
    );
  }

  const octokit = new Octokit({
    // Token generation : https://github.com/settings/tokens/new
    // Permissions : [read:org]
    auth: token,
  });

  const { data: authenticatedUser } = await octokit.users.getAuthenticated();
  const { data: organizations } = await octokit.orgs.listForAuthenticatedUser();
  const { login } = authenticatedUser;

  // Ask user which part he wants to clone
  const questions = [
    {
      type: 'checkbox',
      message:
        'Please select organizations to clone (<Space> to select, <Enter> to validate)',
      name: 'organizations',
      choices: [login, ...organizations.map((org) => org.login)],
    },
  ];

  const { organizations: organizationsToClone } = await inquirer.prompt(
    questions,
  );

  logger.info('Cloning the following organizations');
  logger.info(organizationsToClone);

  for (let i = 0; i < organizationsToClone.length; i += 1) {
    const organization = organizationsToClone[i];

    let data;

    if (organization === login) {
      // User's own repositories
      ({ data } = await octokit.repos.listForAuthenticatedUser({
        type: REPOSITORY_TYPE.OWNER,
      }));
      logger.info(`Cloning user "${login}"`);
    } else {
      // User's organizations repositories
      ({ data } = await octokit.repos.listForOrg({
        org: organization,
      }));
      logger.info(`Cloning organization "${organization}"`);
    }

    const repositories = data.map((repo) => ({
      name: repo.name,
      fullName: repo.full_name,
      sshUrl: repo.ssh_url,
    }));

    const statusBar = new cliProgress.SingleBar(
      {},
      cliProgress.Presets.shades_classic,
    );

    statusBar.start(repositories.length, 0);

    for (let j = 0; j < repositories.length; j += 1) {
      const repository = repositories[j];
      await cloneRepository(repository, destination);
      statusBar.update(j + 1);
    }

    statusBar.stop();
    logger.info(`Organization "${organization}" cloned successfully ✅`);
  }
}

if (require.main === module) {
  // Code section that will run only if current file is the entry point.

  program
    .description(
      'Script to retrieve all repositories from your account (organizations & personal)',
    )
    .requiredOption(
      '-d, --destination <destination>',
      'Destination folder where repositories will be cloned',
    )
    .requiredOption('-t, --token <token>', 'Github authentication token')
    .parse(process.argv);

  const { destination, token } = program;

  cloneRepositories(token, destination)
    .then(() =>
      logger.info('All selected repositories have been cloned successfully ✅'),
    )
    .catch(logger.error);
}
