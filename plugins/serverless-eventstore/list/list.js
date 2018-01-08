'use strict';

const BbPromise = require('bluebird');

class EventStoreUtils {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      es: {
        commands: {
          list: {
            usage: 'Lists all available plugins',
            lifecycleEvents: [
              'list',
            ],
          },
        },
      },
    };

    this.hooks = {
      'es:list:list': () => BbPromise.bind(this)
        .then(this.list)
    };
  }

  list() {
    return BbPromise.bind(this)
      .then(() => console.log('hello'))
  }
}

module.exports = EventStoreUtils;
