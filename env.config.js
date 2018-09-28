const path = require('path');
console.log(__dirname);
module.exports = {
  PRODUCTION: false,
  HOT: true,
  // SOURCE OPTIONS: DEFAULT, EVENTADMIN, RESERVATIONADMIN, CALENDARADMIN
  SOURCE: 'DEFAULT',
  PROJECT_FOLDER: 'mysite/mysite',
  PROXY_TARGET: 'localhost:8000',
  HOST: 'localhost',
  PORT: 3000,
  PATHS: {
    src: unipath('mysite/src'),
    compiled: unipath(path.resolve(__dirname, 'mysite/static')),
    modules: unipath('node_modules'),
    base: unipath('.'),
  },
  FILES: {
    DEFAULT: {
      inputJs: '/js/mysite.js',
      outputJs: 'mysite.js',
      inputSass: '/sass/mysite.sass',
      outputCss: 'mysite.css',
    }
  },
};


function unipath(base) {
  return function join() {
    const _paths = [base].concat(Array.from(arguments));
    return path.resolve(path.join.apply(null, _paths));
  }
}