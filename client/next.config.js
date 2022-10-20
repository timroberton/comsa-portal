module.exports = {

  trailingSlash: true, // Need this so that all routes are put in their own folder, which Rocket server requires

  target: 'serverless',

  webpack: function (config) {

    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader',
    });

    return config;

  },

};
