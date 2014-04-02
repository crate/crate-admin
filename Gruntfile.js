'use strict';

var mountFolder = function (connect, dir) {
  return connect.static(require('path').resolve(dir));
};

module.exports = function (grunt) {
  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  var bower = require('./bower.json');
  var pkg = require('./package.json');

  var crateConf = {
    version: bower.version,
    app: bower.appPath || 'app',
    dist: 'dist',
    tmp: '.tmp'
  };

  grunt.initConfig({
    crate: crateConf,
    watch: {
      recess: {
        files: ['<%= crate.app %>/styles/{,*/}*.less'],
        tasks: ['recess:dist']
      }
    },
    connect: {
      options: {
        port: 9000,
        hostname: 'localhost',
        path: '/?base_uri=http://localhost:4200'
      },
      dev: {
        options: {
          base: '<%= crate.app %>',
          keepalive: true,
          middleware: function (connect) {
            return [
              mountFolder(connect, crateConf.tmp),
              mountFolder(connect, crateConf.app)
            ];
          }
        }
      }
    },
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= crate.tmp %>',
            '<%= crate.dist %>/*',
            '!<%= crate.dist %>/.git*'
          ]
        }]
      },
      components: {
        files: [{
          src: [
            '<%= crate.dist %>/bower_components'
          ]
        }]
      },
      server: '<%= crate.tmp %>'
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        'Gruntfile.js',
        '<%= crate.app %>/scripts/{,*/}*.js'
      ]
    },
    recess: {
      dist: {
        options: {
          compile: true
        },
        files: [{
            expand: true,
            cwd: '<%= crate.app %>/styles',
            src: 'main.less',
            dest: '<%= crate.tmp %>/styles/',
            ext: '.css'
        }]
      }
    },
    rev: {
      dist: {
        files: {
          src: [
            '<%= crate.dist %>/scripts/{,*/}*.js',
            '<%= crate.dist %>/styles/{,*/}*.css',
            '<%= crate.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
            '<%= crate.dist %>/styles/fonts/*'
          ]
        }
      }
    },
    useminPrepare: {
      html: '<%= crate.app %>/index.html',
      options: {
        dest: '<%= crate.dist %>'
      }
    },
    usemin: {
      html: ['<%= crate.dist %>/{,*/}*.html'],
      css: ['<%= crate.dist %>/styles/{,*/}*.css'],
      options: {
        dirs: ['<%= crate.dist %>']
      }
    },
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= crate.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg}',
          dest: '<%= crate.dist %>/images'
        }]
      }
    },
    cssmin: {
      // By default, your `index.html` <!-- Usemin Block --> will take care of
      // minification. This option is pre-configured if you do not wish to use
      // Usemin blocks.
      // dist: {
      //   files: {
      //     '<%= crate.dist %>/styles/main.css': [
      //       '<%= crate.tmp %>/styles/{,*/}*.css',
      //       '<%= crate.app %>/styles/{,*/}*.css'
      //     ]
      //   }
      // }
    },
    htmlmin: {
      dist: {
        options: {
          removeComments: false
          // removeCommentsFromCDATA: false,
          // // https://github.com/yeoman/grunt-usemin/issues/44
          // collapseWhitespace: true,
          // collapseBooleanAttributes: true,
          // removeAttributeQuotes: true,
          // removeRedundantAttributes: true,
          // useShortDoctype: false,
          // removeEmptyAttributes: true,
          // removeOptionalTags: false
        },
        files: [{
          expand: true,
          cwd: '<%= crate.app %>',
          src: ['*.html', 'views/*.html'],
          dest: '<%= crate.dist %>'
        }]
      }
    },
    // Put files not handled in other tasks here
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= crate.app %>',
          dest: '<%= crate.dist %>',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            'bower_components/**/*',
            'images/{,*/}*.{gif,webp,svg}',
            'fonts/**',
          ]
        }, {
          expand: true,
          cwd: '<%= crate.tmp %>/images',
          dest: '<%= crate.dist %>/images',
          src: [
            'generated/*'
          ]
        }]
      }
    },
    concurrent: {
      server: [
        'recess',
      ],
      dist: [
        'recess',
        'imagemin',
        'htmlmin'
      ]
    },
    ngmin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/scripts',
          src: '*.js',
          dest: '<%= crate.dist %>/scripts'
        }]
      }
    },
    uglify: {
      dist: {
        files: {
          '<%= crate.dist %>/scripts/scripts.js': [
            '<%= crate.dist %>/scripts/scripts.js'
          ]
        }
      }
    },
    'string-replace': {
      dist: {
        files: {
          '<%= crate.dist %>/styles/': '*.css',
        },
        options: {
          replacements: [{
            pattern: '../images',
            replacement: 'images'
          }, {
            pattern: '../bower_components',
            replacement: 'bower_components'
          }, {
            pattern: '../fonts/',
            replacement: 'fonts/'
          }]
        }
      }
    }
  });

  grunt.registerTask('build', function(target) {
    if (bower.version != pkg.version) {
      throw new Error("Version numbers in bower.json and package.json do not match!");
    }
    grunt.task.run([
      'clean:dist',
      'useminPrepare',
      'concurrent:dist',
      'concat',
      'copy:dist',
      'ngmin',
      'cssmin',
      'uglify',
      'rev',
      'usemin',
      'string-replace:dist',
      'clean:components'
    ]);
  });

  grunt.registerTask('server', [
    'concurrent:server',
    'connect:dev',
    'watch'
  ]);

  grunt.registerTask('jshint', [
    'jshint'
  ]);

  grunt.registerTask('default', [
    'jshint',
    'build'
  ]);

};

