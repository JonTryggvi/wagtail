//RETRIEVE COMMAND LINE FLAGS TO GLOBAL OBJECT ARG
const arg = (argList => {
    let arg = {}, a, opt, thisOpt, curOpt;
    for (a = 0; a < argList.length; a++) {
        thisOpt = argList[a].trim();
        opt = thisOpt.replace(/^\-+/, '');
        if (opt === thisOpt) {
            // argument value
            if (curOpt) arg[curOpt] = opt;
            curOpt = null;
        }
        else {
            // argument name
            curOpt = opt;
            arg[curOpt] = true;
        }
    }
    return arg;
})(process.argv);

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    notify = require('gulp-notify'),
    filter = require('gulp-filter'),
    rename = require('gulp-rename'),
    plumber = require('gulp-plumber'),
    clean = require('rimraf'),
    uglifycss = require('gulp-uglifycss'),
    svgstore = require('gulp-svgstore'),
    svgmin = require('gulp-svgmin'),
    cheerio = require('gulp-cheerio'),
    autoprefixer = require('gulp-autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'),
    browserSync = require('browser-sync').create(),
    reload = browserSync.reload,
    path = require('path'),
    spawn = require('child_process').spawn,
    webpackStream = require('webpack-stream');
    webpack = require('webpack'),
    webpackDevMiddleware = require('webpack-dev-middleware'),
    webpackHotMiddleware = require('webpack-hot-middleware'),
    webpackConfig = require('./webpack.config'),
    bundler = webpack(webpackConfig),
    { PRODUCTION, HOT, SOURCE, PROXY_TARGET, FILES, PATHS } = require('./env.config');
console.log(FILES[SOURCE].inputJs)
gulp.task('default', () => {
    //gulp.start('styles');
    console.log('gulp', arg)
    //gulp.start('djrun');
    gulp.start('serve');
});

//RUNS CLEAN TASK, COMPILES JS AND OPENS A NEW WINDOW
gulp.task('serve', () => {

    if (arg.clean) {
        gulp.start('clean');
        gulp.start('styles');
    }
    browserSync.init(getBrowserSyncOptions(openWindow = arg.open));

    gulp.watch("src/js/**").on('change', reload)

    gulp.watch(['mysite/src/sass/**/*.sass', 'src/sass/partials/**/*.sass', 'src/sass/admin/partials/**/*.sass']).on('change', buildSass);

    gulp.watch('src/svg/*.svg', ['buildSVG']);

    gulp.watch(['templates/**/*.html']).on('change', reload)
    gulp.watch([
        'mysite/**/*.pyc',
        // 'local_apps/events/context_processors.py',
        'shared/**/*.pyc',
        'mysite/**/*.pyc',
    ]).on('change', reload)

    if (!HOT) {
        // gulp.start('webpack');
        gulp.watch(["src/js/**/*.js", "src/js/**/*.jsx"]).on('change', buildWebpack)
    }
    // if (EVENTADMIN || RESERVATIONADMIN){
    //     gulp.watch(['src/sass/admin/partials/*.sass']).on('change', buildSassAdmin)
    //     // gulp.start('webpack-admin');
    //     gulp.watch(["src/js/admin/EventAdmin.js"]).on('change', buildWebpackEventAdmin)
    //     gulp.watch(["src/js/admin/ReservationAdmin.js"]).on('change', buildWebpackReservationAdmin)
    // }
});

gulp.task('djrun', () => {
    spawn('python', ['manage.py', 'runserver', '0.0.0.0:' + 8000], {
        //stdio: 'inherit'
    });
})


gulp.task('clean', (cb) => {
    //CLEANS COMPILED FOLDER
    clean(PATHS.compiled('js'), function () {
        clean(PATHS.compiled('css'), cb)
    });
});

gulp.task('webpack', () => {
    buildWebpack()
});

gulp.task('styles', () => {
    buildSass()
});

gulp.task('buildSVG', () => {
    buildSVGIconSprite();
});

const getBrowserSyncOptions = (openwindow) => {

    return {
        open: openWindow ? true : false,
        notify: false,
        ghostMode: {
            clicks: true,
            location: true,
            forms: true,
            scroll: true
        },
        proxy: HOT ? {
            // proxy local WP install
            target: PROXY_TARGET,

            middleware: [
                // converts browsersync into a webpack-dev-server
                webpackDevMiddleware(bundler, {
                    publicPath: webpackConfig.output.publicPath,
                }),
                // hot update js && css
                webpackHotMiddleware(bundler),
            ],
        } : PROXY_TARGET
    }
}

// STREAM WEBPACK IF HOT IS SET TO FALSE
const buildWebpack = () => {
    
    return gulp
        .src(PATHS.src(FILES[SOURCE].inputJs))
        .pipe(plumber(function (error) {
            this.emit('end');
            return notify().write(error)
        }))
        .pipe(webpackStream(webpackConfig))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(PATHS.compiled('js')))
        .pipe(reload({
            stream: true
        }))
}

// const buildWebpackEventAdmin = () => {
//     return gulp
//         .src(PATHS.src(FILES.ADMIN.EventAdminInputJs))
//         .pipe(plumber(function (error) {
//             this.emit('end');
//             return notify().write(error)
//         }))
//         .pipe(webpackStream(webpackConfig))
//         .pipe(gulp.dest(PATHS.compiled('js','admin')))
//         .pipe(reload({
//             stream: true
//         }))
// }
// const buildWebpackReservationAdmin = () => {
//     return gulp
//         .src(PATHS.src(FILES.ADMIN.ReservationAdminInputJs))
//         .pipe(plumber(function (error) {
//             this.emit('end');
//             return notify().write(error)
//         }))
//         .pipe(webpackStream(webpackConfig))
//         .pipe(gulp.dest(PATHS.compiled('js','admin')))
//         .pipe(reload({
//             stream: true
//         }))
// }

const buildSass = () => {
    if (PRODUCTION) {
        return gulp
            .src(PATHS.src(FILES[SOURCE].inputSass))
            .pipe(plumber(function (error) {
                this.emit('end');
                return notify().write(error)
            }))
            .pipe(sass())
            .pipe(autoprefixer('last 3 version'))
            .pipe(uglifycss())
            .pipe(filter(['**/*.css']))
            .pipe(rename(FILES[SOURCE].outputCss))
            .pipe(gulp.dest(PATHS.compiled('css')))
            .pipe(reload({
                stream: true
            }))
        // DEVELOPMENT
    } else {
        return gulp
            .src(PATHS.src(FILES[SOURCE].inputSass))
            .pipe(plumber(function (error) {
                this.emit('end');
                return notify().write(error)
            }))
            .pipe(sourcemaps.init())
            .pipe(sass())
            .pipe(filter(['**/*.css']))
            .pipe(rename(FILES[SOURCE].outputCss))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(PATHS.compiled('css')))
            .pipe(reload({
                stream: true
            }))
    }
}

// const buildSassAdmin = () => {
//     return gulp
//         .src(PATHS.src(FILES.ADMIN.inputSass))
//         .pipe(plumber(function (error) {
//             this.emit('end');
//             return notify().write(error)
//         }))
//         .pipe(sourcemaps.init())
//         .pipe(sass())
//         .pipe(sourcemaps.write())
//         .pipe(filter(['**/*.css']))
//         .pipe(rename(FILES.ADMIN.outputCss))
//         .pipe(gulp.dest(PATHS.compiled('css')))
//         .pipe(reload({
//             stream: true
//         }))
// }

const buildSVGIconSprite = () => {
    return gulp
        .src(PATHS.src('svg') + '/*.svg')
        .pipe(cheerio({
            run: function ($) {
                // $('g[fill]').removeAttr('fill');
            },
            parserOptions: { xmlMode: true }
        }))
        .pipe(svgmin(function getOptions(file) {
            var prefix = path.basename(file.relative, path.extname(file.relative));
            return {
                plugins: [{
                    cleanupIDs: {
                        prefix: prefix + '-',
                        minify: true
                    }
                }, {
                    removeXMLProcIns: true
                }, {
                    removeUselessStrokeAndFill: true
                }, {
                    removeComments: true
                }, {
                    removeDoctype: true
                }, {
                    removeTitle: true
                }, {
                    collapseGroups: true
                }, {
                    moveGroupAttrsToElems: true
                }, {
                    removeAttrs: false
                    // {attrs: '(stroke)'} 
                }]
            }
        }))
        .pipe(svgstore({ inlineSvg: true }))
        .pipe(rename('icons.svg'))
        .pipe(gulp.dest(PATHS.compiled('icons')))
}