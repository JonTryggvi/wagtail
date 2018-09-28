var path = require('path'),
    webpack = require('webpack'),
    WriteFilePlugin = require('write-file-webpack-plugin'),
    UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
    { PRODUCTION, HOT,SOURCE, HOST, PORT, PROJECT_FOLDER, FILES, PATHS } = require('./env.config');


module.exports = {
  
  entry: getEntry(),

  output: getOutput(),
  
  devtool: PRODUCTION ? false : 'eval',
  
  target: 'web',

  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        include: PATHS.src(),
        use: getJsLoaders()
      },
    ]
  },
  
  plugins: getPlugins()
  
};

function getPlugins(){
  if (PRODUCTION) {
    return [ 
      new webpack.optimize.UglifyJsPlugin({
        mangle: true,
        sourcemap: false,
        comments: false
        }),
        new WriteFilePlugin()
    ]
  } else if (HOT) {
    return [
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
      new WriteFilePlugin()
    ]
  }
}

function getEntry() {
  var entry = {};
  entry.main = [PATHS.src(FILES[SOURCE].inputJs)];
  // if (HOT) entry.main.push('webpack-hot-middleware/client?noInfo=true&reload=true');
  return entry;
}

function getOutput(){
   if (HOT) {
    return {
      path: PATHS.compiled('js'),
      publicPath: `http://${HOST}:${PORT}/${PROJECT_FOLDER}/`,
      filename: FILES[SOURCE].outputJs,
     }
  } else {
    return {
      path: PATHS.compiled('js'),
      filename: FILES[SOURCE].outputJs,
    }
  }
}

function getJsLoaders() {
  let JsLoaders = [
    {
      loader: 'babel-loader',
      options: {
        presets: [
          ["env", { "modules": false }],
          ["react"]
          ],
        plugins: [ 
            ["transform-object-rest-spread", { "useBuiltIns": true }],
            "transform-class-properties"
        ]
      }
    }
  ]
  if (HOT) JsLoaders.push({ loader: 'webpack-module-hot-accept' })
  return JsLoaders
}