import config from './config/config.js';
import app from './server/express.js';
import mongoose from 'mongoose';

mongoose.Promise = global.Promise;

mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('Connected to the database!');
    app.listen(config.port, (err) => {
      if (err) {
        console.error('Unable to start the server.');
        return;
      }
      console.info('Server started on port %s.', config.port);
    });
  })
  .catch(() => {
    console.error('Unable to connect to the database.');
    process.exitCode = 1;
  });
