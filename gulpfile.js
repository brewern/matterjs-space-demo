var gulp = require('gulp'),
    connect = require('gulp-connect');
 
gulp.task('connect', function() {
  connect.server({
    root: 'app',
    livereload: true
  });
});
 
gulp.task('html', function () {
  gulp.src('./app/*.html')
    .pipe(connect.reload());
});
 
gulp.task('watch', function () {
  gulp.watch([
    './app/*.html',
    './app/*.js',
    './app/src/*.js'
  ], ['html']);
});
 
gulp.task('default', ['connect', 'watch']);
