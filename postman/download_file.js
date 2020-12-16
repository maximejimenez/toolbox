const fs = require('fs');
const newman = require('newman');

let result = newman
  .run({
    reporters: 'cli',
    collection: '/Users/maximejimenez/Postman/files/Test.postman_dump.json',
  })
  .on('request', (err, args) => {
    if (err) {
      console.log(err);
    }
    fs.writeFileSync(`./file.pdf`, args.response.stream, 'binary');
    result = args.response.stream;
  })
  .on('done', function (err, summary) {
    if (err) {
      console.log(err);
    }
    if (summary) {
      console.log(summary);
    }

    fs.writeFileSync(`./file.pdf`, result, 'binary');
  });
