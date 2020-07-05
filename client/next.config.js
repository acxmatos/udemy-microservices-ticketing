//
// Small trick to make sure NextJS detects changes to .js
// files correctly and refresh the application
// The native way doesn't work well on NextJS applications
// running inside containers, so this should be fixed
// by polling all files from the folders every 300 miliseconds
// (that's what the below configuration is doing)
//
module.exports = {
  webpackDevMiddleware: (config) => {
    config.watchOptions.poll = 300;
    return config;
  },
};
