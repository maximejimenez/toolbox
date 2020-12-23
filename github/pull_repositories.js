/* eslint-disable no-await-in-loop */

// Usage: node github/pull_repositories.js --target /my/target

const cliProgress = require('cli-progress');
const program = require('commander');
const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const winston = require('winston');

const ORIGIN = 'origin';
const MASTER = 'master';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

const git = simpleGit();

async function pullRepository(target, repo) {
  const repositoryPath = path.resolve(target, repo);
  try {
    await git.cwd(repositoryPath).fetch();

    const status = await git.cwd(repositoryPath).status();
    const isClean = status.isClean();
    const isMasterCheckedOut = status.current === MASTER;

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

    return true;
  } catch (err) {
    logger.error(err);
    return false;
  }
}

async function pullRepositories(target) {
  if (!fs.existsSync(target) || !fs.lstatSync(target).isDirectory()) {
    throw new Error(
      `Target : "${target}" does not exist or is not a directory`,
    );
  }

  const repositories = fs
    .readdirSync(target, { withFileTypes: true })
    .filter((file) => file.isDirectory())
    .map((dirent) => dirent.name);

  const statusBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );

  statusBar.start(repositories.length, 0);

  const failures = [];

  for (let j = 0; j < repositories.length; j += 1) {
    const repository = repositories[j];
    const success = await pullRepository(target, repository);

    if (!success) {
      failures.push(repository);
    }
    statusBar.update(j + 1);
  }

  statusBar.stop();

  logger.info('Repositories have been updated successfully ✅');

  if (failures.length > 0) {
    logger.info(`Except the following ${JSON.stringify(failures)}`);
  }
}

if (require.main === module) {
  // Code section that will run only if current file is the entry point.

  program
    .description(
      'Script to update all repositories from origin/master if master is the current branch',
    )
    .requiredOption(
      '-t, --target <target>',
      'Target folder where are repositories',
    )
    .parse(process.argv);

  const { target } = program;

  pullRepositories(target)
    .then(() => logger.info('Repositories have been updated successfully ✅'))
    .catch(logger.error);
}
