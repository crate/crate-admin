/**
 * Load all 3rd party imports here so it'll be
 * directly included in vendor.bundle.js file.
 */
// import 'jquery';
import $ from 'jquery/dist/jquery.js';
window.jQuery = $;
window.$ = $;

// import 'CodeMirror';
import CodeMirror from 'codemirror/lib/codemirror.js';
window.CodeMirror = CodeMirror;
import 'bootstrap/dist/js/bootstrap.min.js';

import 'codemirror/mode/sql/sql.js';

import 'bootstrap-sass/assets/javascripts/bootstrap.min.js';

import '@uirouter/angularjs';
import 'angular-cookies';
import 'angular-sanitize';
import 'json3';
import 'angular-translate';
import 'angular-translate-loader-static-files';
import 'angular-translate-storage-cookie';
import 'angular-translate-loader-partial';
import 'oclazyload';
import 'angular-nvd3';
