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
        files: ['<%= crate.app %>/static/i18n/**'],
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
            '<%= crate.dist %>/static/bower_components',
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
          dest: '<%= crate.tmp %>/static/styles/',
          ext: '.css'
        }]
      },
      dev: {
        options: {
          compile: true
        },
        files: [{
          expand: true,
          cwd: '<%= crate.app %>/styles',
          src: 'main.less',
          dest: '<%= crate.tmp %>/static/styles/',
          ext: '.css'
        }]
      }
    },
    filerev: {
      dist: {
        src: [
          '<%= crate.dist %>/static/scripts/{,*/}*.js',
          '<%= crate.dist %>/static/styles/{,*/}*.css',
          '<%= crate.dist %>/static/assets/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
          '<%= crate.dist %>/static/styles/fonts/*'
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
        '<%= crate.dist %>/static/views/**/*.html'
      ],
      css: [
        '<%= crate.dist %>/static/styles/**/*.css'
      ],
      js: [
        '<%= crate.dist %>/static/scripts/**/*.js'
      ],
      options: {
        root: [
          '<%= crate.dist %>'
        ],
        assetsDirs: [
          '<%= crate.dist %>',
          '<%= crate.dist %>/static/views',
          '<%= crate.dist %>/static/styles',
          '<%= crate.dist %>/static/fonts',
          '<%= crate.dist %>/static/scripts'
        ],
        patterns: {
          js: [
            [
              /['"](static\/assets\/[^'"]+\.(?:gif|jpg|png|svg))['"]/gm,
              'Update the JS to reference our revved images'
            ]
          ]
        }
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      dist: {
        files: {
          '<%= crate.dist %>/static/scripts/scripts.js': [
            '<%= crate.dist %>/static/scripts/scripts.js'
          ]
        }
      }
    },
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= crate.app %>/static/assets',
          src: '{,*/}*.{png,jpg,jpeg,svg}',
          dest: '<%= crate.dist %>/static/assets'
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
          src: ['*.html'],
          dest: '<%= crate.dist %>'
        }, {
          expand: true,
          cwd: '<%= crate.app %>',
          src: ['views/*.html'],
          dest: '<%= crate.dist %>/static'
        }]
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= crate.app %>',
          dest: '<%= crate.dist %>/static',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            'bower_components/**/*',
            'plugins/**',
            'conf/**'
          ]
        }, {
          expand: true,
          dot: true,
          cwd: '<%= crate.app %>/static',
          dest: '<%= crate.dist %>/static',
          src: [
            'i18n/**'
          ]
        }, {
          expand: true,
          dot: true,
          cwd: '<%= crate.app %>/static',
          dest: '<%= crate.dist %>/static',
          src: [
            'fonts/**'
          ]
        }, {
          expand: true,
          cwd: '<%= crate.app %>',
          dest: '<%= crate.dist %>/static/fonts',
          src: [
            'bower_components/font-awesome/fonts/*',
            'bower_components/bootstrap/dist/fonts/*'
          ]
        }, {
          expand: true,
          cwd: '<%= crate.tmp %>/static/assets',
          dest: '<%= crate.dist %>/static/assets',
          src: [
            'generated/*'
          ]
        }, {
          expand: true,
          cwd: '<%= crate.tmp %>/static',
          dest: '<%= crate.dist %>/static',
          src: [
            'styles/**'
          ]
        }]
      },
      i18nTmp: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= crate.app %>/static',
          dest: '<%= crate.tmp %>/static',
          src: [
            'i18n/**'
          ]
        }]
      },
      fontsTmp: {
        files: [{
          expand: true,
          cwd: '<%= crate.app %>',
          dest: '<%= crate.tmp %>/static',
          src: [
            'bower_components/font-awesome/fonts/*',
            'bower_components/bootstrap/dist/fonts/*'
          ]
        }]
      }
    },
    concurrent: {
      server: [
        'less:dev'
      ],
      dist: [
        'less:dist',
        'imagemin',
        'htmlmin'
      ]
    },
    'string-replace': {
      dist: {
        files: {
          '<%= crate.dist %>/static/styles/': '<%= crate.dist %>/static/styles/*.css'
        },
        options: {
          replacements: [{
            pattern: /\.{2}\/(bower_components\/font-awesome\/fonts)/ig,
            replacement: '../$1'
          }, {
            pattern: /\.{2}\/(bower_components\/bootstrap\/dist\/fonts)/ig,
            replacement: '../$1'
          }]
        }
      },
      replacejs: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/static/scripts',
          src: '*.js',
          dest: '<%= crate.dist %>/static/scripts'
        }],
        options: {
          replacements: [{
            pattern: /(conf\/plugins.json)/ig,
            replacement: 'static/conf/plugins.json'
          }, {
            pattern: /(views\/)/ig,
            replacement: 'static/views/'
          }]
        }
      },
      replacepluginsjs: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/static/plugins/tutorial',
          src: '*.js',
          dest: '<%= crate.dist %>/static/plugins/tutorial'
        }],
        options: {
          replacements: [{
            pattern: /(plugins\/tutorial)/ig,
            replacement: 'static/plugins/tutorial'
          }]
        }
      },
      replacepluginshtml: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/static/plugins/tutorial',
          src: '*.html',
          dest: '<%= crate.dist %>/static/plugins/tutorial'
        }],
        options: {
          replacements: [{
            pattern: /(plugins\/tutorial)/ig,
            replacement: 'static/plugins/tutorial'
          }]
        }
      },
      replaceconf: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/static/conf',
          src: '*.json',
          dest: '<%= crate.dist %>/static/conf'
        }],
        options: {
          replacements: [{
            pattern: /(plugins\/tutorial\/tutorial.js)/ig,
            replacement: 'static/plugins/tutorial/tutorial.js'
          }, {
            pattern: /(plugins\/tutorial\/tutorial.html)/ig,
            replacement: 'static/plugins/tutorial/tutorial.html'
          }]
        }
      },
      replaceviews: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/static/views',
          src: '*.html',
          dest: '<%= crate.dist %>/static/views'
        }],
        options: {
          replacements: [{
            pattern: /(views\/)/ig,
            replacement: 'static/views/'
          }]
        }
      },
      replacecss: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/static/styles',
          src: '*.css',
          dest: '<%= crate.dist %>/static/styles'
        }],
        options: {
          replacements: [{
            pattern: /(\/bower_components\/)/ig,
            replacement: '/fonts/bower_components/'
          }]
        }
      },
      replaceindex: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>',
          src: '*.html',
          dest: '<%= crate.dist %>'
        }],
        options: {
          replacements: [{
            pattern: '\'views/nav.html\'',
            replacement: '\'static/views/nav.html\''
          }]
        }
      }
    },
    karma: {
      options: {
        frameworks: ['jasmine'],
        logLevel: 'ERROR',
        singleRun: true,
        reporters: ['mocha', 'progress', 'coverage'],
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
          'app/bower_components/angular-nvd3/dist/angular-nvd3.js',
          'app/bower_components/ocLazyLoad/dist/ocLazyLoad.js',
          'app/scripts/app.js',
          'app/scripts/**/*.js',
          'app/plugins/**/*.js',
          'app/tests/**/*.js',
          'app/conf/plugins.json',
        ],
        exclude: ['app/scripts/services/segmentio.js',],
        preprocessors: {
          'app/scripts/**/*.js': ['coverage']
        },
        coverageReporter: {
          // specify a common output directory
          dir: 'app/tests/coverage',
          type: 'lcov',
          subdir: '.'
        },
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
      'string-replace:replacejs',
      'string-replace:replaceviews',
      'string-replace:replaceindex',
      'string-replace:replaceconf',
      'string-replace:replacecss',
      'string-replace:replacepluginsjs',
      'string-replace:replacepluginshtml',
      'clean:components'
    ]);
  });

  grunt.registerTask('server', [
    'concurrent:server',
    'copy:i18nTmp',
    'copy:fontsTmp',
    'connect:dev',
    'watch'
  ]);

  grunt.registerTask('test', [
    'jshint',
    'karma:all_tests'
  ]);

};