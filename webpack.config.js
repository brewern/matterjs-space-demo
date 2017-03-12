var path = require('path');

module.exports = {
  entry: './app/index.js',
  output: {
    path: path.resolve(__dirname, 'app', 'src'),
    filename: 'app.bundle.js',
    libraryTarget: 'umd'
  },
  resolve: {
    modules: [
      "node_modules",
      path.resolve(__dirname, "app")
    ]
  },
  externals: {
    'matter': 'Matter',
    'matter-attractors': 'MatterAttractors'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        options: {
          plugins: ['lodash']
        }
      }
    ]
  }
}
