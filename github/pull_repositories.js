/* eslint-disable no-await-in-loop */

// Usage: node github/pull_repositories.js --target /my/target

const program = require('commander');
const fs = require('fs');
const path = require('path');
const Piscina = require('piscina');
const getStatusBar = require('../utils/getStatusBar');
const getLogger = require('../utils/getLogger');

const pull = new Piscina({
  filename: require.resolve('./git/pull.js'),
});

const logger = getLogger();

async function pullRepositories(target) {
  if (!fs.existsSync(target) || !fs.lstatSync(target).isDirectory()) {
    throw new Error(
      `Target : "${target}" does not exist or is not a directory`,
    );
  }

  const repositories = fs
    .readdirSync(target, { withFileTypes: true })
    .filter(
      (file) =>
        file.isDirectory() &&
        fs.existsSync(path.join(target, file.name, '.git')),
    )
    .map((dirent) => dirent.name);

  const failures = [];
  const threads = [];

  const statusBar = getStatusBar(repositories.length);

  statusBar.start();

  for (let j = 0; j < repositories.length; j += 1) {
    const repository = repositories[j];

    const thread = pull
      .run({ target, repository })
      .then(({ success, error }) => {
        statusBar.update();

        if (!success) {
          failures.push(error);
        }
      });

    threads.push(thread);
  }

  await Promise.all(threads);

  statusBar.stop();

  return failures;
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
    .then((failures) => {
      logger.info('Repositories have been updated successfully ✅');

      if (failures.length > 0) {
        logger.info('Except the following:');

        failures.forEach((failure) => {
          logger.info(`- ${failure}`);
        });
      }
    })
    .catch((error) => {
      logger.error(error);

      process.exit(1);
    });
}
