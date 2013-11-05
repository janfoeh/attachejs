module.exports = function(grunt) {

  var attache = {
    buildDir: 'dist'
  };

  // Project configuration.
  grunt.initConfig({
    appConfig: attache,
    pkg: grunt.file.readJSON('package.json'),
    jsdoc : {
        dist : {
            src: ['attache.js', 'attache-jquery.js', 'attache-knockout.js'],
            options: {
                destination: 'doc',
                private: false
            }
        }
    }
    // copy: {
    //   // NOTE: copy MUST have a target - just using copy: { files: ... } yields an 'missing indexOf' error
    //   build: {
    //     files: [
    //       {src: ['css/fonts/*'], dest: '<%= appConfig.buildDir %>/', filter: 'isFile'},
    //       {src: ['videos/*'], dest: '<%= appConfig.buildDir %>/', filter: 'isFile'}
    //     ]
    //   }
    // },
    // uglify: {
    //   options: {
    //     report: 'gzip',
    //     mangle: false
    //   }
    // }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-jsdoc');

  grunt.registerTask('default', [
    'jsdoc'
  ]);
};