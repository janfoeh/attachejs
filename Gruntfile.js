module.exports = function(grunt) {

  var attache = {
    buildDir: 'dist'
  };

  // Project configuration.
  grunt.initConfig({
    appConfig: attache,
    pkg: grunt.file.readJSON('package.json'),
    clean: ['<%= appConfig.buildDir %>'],
    jsdoc : {
        dist : {
            src: ['src/*.js', 'test/*.js'],
            options: {
                destination: 'doc'
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