'use strict';

var mountFolder = function(connect, dir) {
  var path = require('path');
  return connect.static(path.resolve(dir));
};

module.exports = function(grunt) {
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
      }
    },
    connect: {
      options: {
        port: 9000,
        hostname: 'localhost',
        path: '/'
      },
      dev: {
        options: {
          base: '<%= crate.app %>',
          middleware: function(connect) {
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
            '<%= crate.dist %>'
          ]
        }]
      },
      components: {
        files: [{
          src: [
            '<%= crate.dist %>/admin/bower_components',
            '!<%= crate.dist %>/bower_components/font-awesome/fonts'
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
    less: {
      dist: {
        options: {
          compile: true
        },
        files: [{
          expand: true,
          cwd: '<%= crate.app %>/styles',
          src: 'main.less',
          dest: '<%= crate.tmp %>/admin/styles/',
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
          dest: '<%= crate.tmp %>/styles/',
          ext: '.css'
        }]
      }
    },
    rev: {
      dist: {
        files: {
          src: [
            '<%= crate.dist %>/admin/scripts/{,*/}*.js',
            '<%= crate.dist %>/admin/styles/{,*/}*.css',
            '<%= crate.dist %>/admin/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
            '<%= crate.dist %>/admin/styles/fonts/*'
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
      css: ['<%= crate.dist %>/admin/styles/{,*/}*.css'],
      options: {
        dirs: ['<%= crate.dist %>/admin']
      }
    },
    imagemin: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= crate.app %>/images',
          src: '{,*/}*.{png,jpg,jpeg}',
          dest: '<%= crate.dist %>/admin/images'
        }]
      }
    },
    cssmin: {},
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
          dest: '<%= crate.dist %>/admin'
        }]
      }
    },
    copy: {
      dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= crate.app %>',
          dest: '<%= crate.dist %>/admin',
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
          dest: '<%= crate.dist %>/admin/fonts',
          src: [
            'bower_components/font-awesome/fonts/*',
            'bower_components/bootstrap/dist/fonts/*'
          ]
        }, {
          expand: true,
          cwd: '<%= crate.tmp %>/images',
          dest: '<%= crate.dist %>/admin/images',
          src: [
            'generated/*'
          ]
        }, {
          expand: true,
          cwd: '<%= crate.tmp %>/admin',
          dest: '<%= crate.dist %>/admin',
          src: [
            'styles/**'
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
        'less:dev'
      ],
      dist: [
        'less:dist',
        'imagemin',
        'htmlmin'
      ]
    },
    ngAnnotate: {
      dist: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/scripts',
          src: '*.js',
          dest: '<%= crate.dist %>/admin/scripts'
        }]
      }
    },
    uglify: {
      options: {
        mangle: false
      },
      dist: {
        files: {
          '<%= crate.dist %>/admin/scripts/scripts.js': [
            '<%= crate.dist %>/admin/scripts/scripts.js'
          ]
        }
      }
    },
    'string-replace': {
      dist: {
        files: {
          '<%= crate.dist %>/admin/styles/': '<%= crate.dist %>/admin/styles/*.css'
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
      },
      replacejs: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/admin/scripts',
          src: '*.js',
          dest: '<%= crate.dist %>/admin/scripts'
        }],
        options: {
          replacements: [{
            pattern: /({part}\/i18n\/{lang}.json)/ig,
            replacement: 'admin/{part}/i18n/{lang}.json'
          }, {
            pattern: /(conf\/plugins.json)/ig,
            replacement: 'admin/conf/plugins.json'
          }, {
            pattern: /(views\/)/ig,
            replacement: 'admin/views/'
          }]
        }
      },
      replaceconf: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/admin/conf',
          src: '*.json',
          dest: '<%= crate.dist %>/admin/conf'
        }],
        options: {
          replacements: [{
            pattern: /(plugins\/tutorial\/tutorial.js)/ig,
            replacement: 'admin/plugins/tutorial/tutorial.js'
          }, {
            pattern: /(plugins\/tutorial\/tutorial.html)/ig,
            replacement: 'admin/plugins/tutorial/tutorial.html'
          }]
        }
      },
      replaceviews: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/admin/views',
          src: '*.html',
          dest: '<%= crate.dist %>/admin/views'
        }],
        options: {
          replacements: [{
            pattern: /(views\/)/ig,
            replacement: 'admin/views/'
          }]
        }
      },
      replacecss: {
        files: [{
          expand: true,
          cwd: '<%= crate.dist %>/admin/styles',
          src: '*.css',
          dest: '<%= crate.dist %>/admin/styles'
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
          replacements: [
            {
              pattern: '\'views/nav.html\'',
              replacement: '\'admin/views/nav.html\''
            }
          ]
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
      'ngAnnotate',
      'cssmin',
      'uglify',
      'rev',
      'usemin',
      'string-replace:replacejs',
      'string-replace:replaceviews',
      'string-replace:replaceindex',
      'string-replace:replaceconf',
      'string-replace:replacecss',
      'clean:components'
    ]);
  });

  grunt.registerTask('server', [
    'clean:dist',
    'concurrent:server',
    'copy:i18nTmp',
    'connect:dev',
    'watch'
  ]);

  grunt.registerTask('default', [
    'jshint',
    'build'
  ]);

};