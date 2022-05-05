const cliProgress = require('cli-progress');

const getStatusBar = (total) => {
  let counter = 0;

  const statusBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );

  return {
    start() {
      statusBar.start(total, 0);
    },
    update() {
      statusBar.update((counter += 1));
    },
    stop() {
      statusBar.stop();
    },
  };
};

module.exports = getStatusBar;
