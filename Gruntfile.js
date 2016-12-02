'use strict';

module.exports = function(grunt) {
  var serveStatic = require('serve-static');
  // load all grunt tasks
  var matchDep = require('matchdep');
  matchDep.filterDev('grunt-*').forEach(grunt.loadNpmTasks);

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
      options: {
        livereload: true
      },
      less: {
        files: ['<%= crate.app %>/styles/{,*/}*.less'],
        tasks: ['less:dist']
      },
      i18n: {
        files: ['<%= crate.app %>/i18n/**'],
        tasks: ['copy:i18nTmp']
      },
      hint: {
        files: ['<%= crate.app %>/scripts/{,*/}*.js'],
        tasks: ['jshint']
      }
    },
    connect: {
      options: {
        port: 9000,
        path: '/'
      },
      dev: {
        options: {
          base: '<%= crate.app %>',
          middleware: function() {
            return [
              serveStatic(crateConf.tmp),
              serveStatic(crateConf.app)
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
            '<%= crate.dist %>'
          ]
        }]
      },
      components: {
        files: [{
          src: [
            '<%= crate.dist %>/bower_components',
            '!<%= crate.dist %>/bower_components/font-awesome/fonts'
          ]
        }]
      },
      server: '<%= crate.tmp %>'
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        ignores: [
          '<%= crate.app %>/scripts/services/segmentio.js'
        ]
      },
      all: [
        'Gruntfile.js',
        '<%= crate.app %>/scripts/{,*/}*.js',
        '<%= crate.app %>/plugins/**/*.js'
      ],
    },
    validation: {
      options: {
        wrapfile: 'validator.html'
      },
      files: {
        src: [
          '<%= crate.app %>/index.html',
          '<%= crate.app %>/views/{,*/}*.html'
        ]
      }
    },
    less: {
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
    filerev: {
      dist: {
        src: [
          '<%= crate.dist %>/scripts/{,*/}*.js',
          '<%= crate.dist %>/styles/{,*/}*.css',
          '<%= crate.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= crate.dist %>/styles/fonts/*'
        ]
      }
    },
    useminPrepare: {
      html: '<%= crate.app %>/index.html',
      options: {
        dest: '<%= crate.dist %>'
      }
    },
    usemin: {
      html: [
        '<%= crate.dist %>/index.html',
        '<%= crate.dist %>/views/**/*.html'
      ],
      css: [
        '<%= crate.dist %>/styles/**/*.css'
      ],
      js: [
        '<%= crate.dist %>/scripts/**/*.js'
      ],
      options: {
        root: [
          '<%= crate.dist %>'
        ],
        assetsDirs: [
          '<%= crate.dist %>',
          '<%= crate.dist %>/views',
          '<%= crate.dist %>/styles',
          '<%= crate.dist %>/fonts',
          '<%= crate.dist %>/scripts'
        ],
        patterns: {
          js: [
            [
              /['"](images\/[^'"]+\.(?:gif|jpg|png|svg))['"]/gm,
              'Update the JS to reference our revved images'
            ]
          ]
        }
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
    ngAnnotate: {
      generated: {
        files: [{
          expand: true,
          cwd: '<%= crate.tmp %>/concat/scripts',
          src: '*.js',
          dest: '<%= crate.tmp %>/concat/scripts'
        }]
      }
    },
    htmlmin: {
      dist: {
        options: {
          removeComments: false
        },
        files: [{
          expand: true,
          cwd: '<%= crate.app %>',
          src: ['*.html', 'views/*.html'],
          dest: '<%= crate.dist %>'
        }]
      }
    },
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
            'plugins/**',
            'conf/**',
            'i18n/**'
          ]
        }, {
          expand: true,
          cwd: '<%= crate.app %>',
          dest: '<%= crate.dist %>/fonts',
          src: [
            'bower_components/font-awesome/fonts/*',
            'bower_components/bootstrap/dist/fonts/*'
          ]
        }, {
          expand: true,
          cwd: '<%= crate.tmp %>/images',
          dest: '<%= crate.dist %>/images',
          src: [
            'generated/*'
          ]
        }]
      },
      i18nTmp: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= crate.app %>',
          dest: '<%= crate.tmp %>',
          src: [
            'i18n/**'
          ]
        }]
      },
    },
    concurrent: {
      server: [
        'less'
      ],
      dist: [
        'less',
        'imagemin',
        'htmlmin'
      ]
    },
    'string-replace': {
      dist: {
        files: {
          '<%= crate.dist %>/styles/': '<%= crate.dist %>/styles/*.css'
        },
        options: {
          replacements: [{
            pattern: /\.{2}\/(bower_components\/font-awesome\/fonts)/ig,
            replacement: '../fonts/$1'
          }, {
            pattern: /\.{2}\/(bower_components\/bootstrap\/dist\/fonts)/ig,
            replacement: '../fonts/$1'
          }]
        }
      }
    },
    karma: {
      options: {
        frameworks: ['jasmine'],
        logLevel: 'ERROR',
        singleRun: true,
        reporters: ['mocha','progress', 'coverage'],
        files: [
          'app/bower_components/jquery/dist/jquery.js',
          'app/bower_components/angular/angular.js',
          'app/bower_components/angular-mocks/angular-mocks.js',
          'app/bower_components/angular-cookies/angular-cookies.js',
          'app/bower_components/angular-route/angular-route.js',
          'app/bower_components/angular-sanitize/angular-sanitize.js',
          'app/bower_components/angular-translate/angular-translate.js',
          'app/bower_components/angular-translate-loader-partial/angular-translate-loader-partial.js',
          'app/bower_components/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
          'app/bower_components/angular-translate-storage-cookie/angular-translate-storage-cookie.js',
          'app/bower_components/angular-truncate-2/dist/angular-truncate-2.js',
          'app/bower_components/angularjs-nvd3-directives/dist/angularjs-nvd3-directives.js',
          'app/scripts/app.js',
          'app/scripts/**/*.js',
          'app/plugins/**/*.js',
          'app/tests/**/*.js',
          'app/conf/plugins.json',
        ],
        preprocessors: {
          'app/scripts/**/*.js': ['coverage']
        }
      },
      all_tests: {
        browsers: ['PhantomJS']
      },
    }
  });

  grunt.registerTask('build', function() {
    grunt.log.ok('Building CrateDB Admin UI.');
    if (bower.version != pkg.version) {
      throw new Error('Version numbers in bower.json and package.json do not match!');
    }
    grunt.task.run([
      'clean:dist',
      'useminPrepare',
      'concurrent:dist',
      'concat:generated',
      'copy:dist',
      'ngAnnotate:generated',
      'cssmin:generated',
      'uglify:generated',
      'filerev',
      'usemin',
      'string-replace:dist',
      'clean:components'
    ]);
  });

  grunt.registerTask('server', [
    'concurrent:server',
    'copy:i18nTmp',
    'connect:dev',
    'watch'
  ]);

  grunt.registerTask('test', [
    'jshint',
    'karma:all_tests'
  ]);

};
