'use strict';

module.exports = function(grunt) {
    grunt.initConfig({
        uglify: {
            gen: {
                files: [{
                    expand: true,
                    cwd: './src/',
                    src: '*.js',
                    dest: './dist/'
                }]
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['uglify']);
};
