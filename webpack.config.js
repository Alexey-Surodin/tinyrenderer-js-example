const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'src/index.ts'),
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: {
          loader: "ts-loader",
          options: {
            projectReferences: true
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.txt$/i,
        use: 'raw-loader',
      },
      {
        test: /\.tga$/i,
        use: 'file-loader',
      },
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.scss'],
    alias: {
      module: false
    },
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'src/static/'), to: path.resolve(__dirname, 'dist') },
      ],
    }),
  ],
  
};


