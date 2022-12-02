###############
Developer guide
###############


*****
Setup
*****

Install Node.js locally::

    python3 -m venv .venv
    source .venv/bin/activate
    pip install -U pip
    pip install nodeenv
    nodeenv --python-virtualenv --node=18.12.1

Install the package dependencies::

    npm install

Workaround::

    # Mitigate `Error: error:0308010C:digital envelope routines::unsupported` on Node.js 18
    # https://stackoverflow.com/a/69699772
    # https://github.com/webpack/webpack/issues/14532#issuecomment-947012063
    export NODE_OPTIONS=--openssl-legacy-provider


*****
Tests
*****

To run the tests, use the following commands::

    npm test



***********************
Development environment
***********************


Quickstart
==========

Start CrateDB::

    npm run cratedb

Start the development server on ``http://localhost:9000/``::

    npm run develop

After the application has been compiled and the Webpack development server has
started, the process should automatically open a browser tab.


Description
===========

There is a ``base_uri`` parameter intended for development use only. You can
use it to specify the URL of your CrateDB instance, like::

    http://localhost:9000/?base_uri=http://localhost:4200

When running CrateDB by other means, please make sure to enable *Cross-Origin
Resource Sharing* in your `CrateDB configuration`_, like::

    http.cors.enabled: true
    http.cors.allow-origin: "*"



**********************
Development operations
**********************

Adding new dependencies
=======================

To add application dependencies, invoke::

    npm install [dependency] --save

This dependency should then be imported in ``./app/vendor.module.js``,
for the application to load correctly.

If the dependency is an angular module, it should also be included in ``MODULES``
in ``./app/app.module.js``

To add development dependencies, invoke::

    npm install [dependency] --save-dev


Adding new components
=====================

When a new component is created (a module or a service or a controller),
it should be imported to ``./app/app.components.js``.


Adding new stylesheets
======================

When a new stylesheet is created it should be imported to
``./styles/styles.scss``, this applies to both vanilla and vendor stylesheets.


Maintaining dependencies
========================

In order to find critical updates for the packages used as dependencies, run::

    npm audit

Then, either run ``npm audit fix``, or edit ``package.json`` manually, also
taking the ``overrides`` section into consideration.

In order to lock the dependencies, updating ``package-lock.json`` accordingly,
run ``npm install --package-lock-only``.


Plugins
=======

On startup, the ``conf/plugins.json`` file is read and plugins
(Angular modules) are loaded.

The `tutorial plugin`_ is loaded by the default configuration.


********
Building
********

To compile the app without development mode, invoke::

    source .venv/bin/activate
    npm run build

To run the Admin UI as a standalone app, open the ``build/index.html`` file in
your browser.


*********
Releasing
*********

Preparing a release
===================

Before releasing, run through the `Admin UI Release Preflight`_.

To create a new release, you must:

- Add the new version to ``package.json``

- Invoke ``npm install --package-lock-only`` in order to update ``package-lock.json``

- Add a section for the new version in the ``CHANGES.rst`` file

- Commit your changes with a message like "Release x.y.z"

- Push to origin and create a tag by invoking ``./devtools/create_tag.sh``

- Run the ``crate_admin_release`` job in Jenkins


*************
Documentation
*************

The documentation is written using `Sphinx`_ and `ReStructuredText`_.


Working on the documentation
============================

Python >= 3.7 is required.

Change into the ``docs`` directory:

.. code-block:: console

    $ cd docs

For help, run:

.. code-block:: console

    $ make

    Crate Docs Build

    Run `make <TARGET>`, where <TARGET> is one of:

      dev     Run a Sphinx development server that builds and lints the
              documentation as you edit the source files

      html    Build the static HTML output

      check   Build, test, and lint the documentation

      reset   Reset the build cache

You must install `fswatch`_ to use the ``dev`` target.


Continuous integration and deployment
=====================================

|docs-version|

GitHub Actions is configured to run ``make check`` from the ``docs``
directory. Please do not merge pull requests until the tests pass.

`Read the Docs`_ (RTD) automatically deploys the documentation whenever a
configured branch is updated.

To make changes to the RTD configuration (e.g., to activate or deactivate a
release version), please contact the `@crate/tech-writing`_ team.

.. |docs-version| image:: https://img.shields.io/endpoint.svg?color=blue&url=https%3A%2F%2Fraw.githubusercontent.com%2Fcrate%2Fcrate-admin%2Fmain%2Fdocs%2Fbuild.json
    :alt: Documentation version
    :target: https://github.com/crate/crate-admin/blob/main/docs/build.json

.. _@crate/tech-writing: https://github.com/orgs/crate/teams/tech-writing
.. _Admin UI Release Preflight: https://github.com/crate/crate-admin/wiki/Admin-UI-Release-Preflight
.. _CrateDB configuration: https://crate.io/docs/reference/configuration.html
.. _fswatch: https://github.com/emcrisostomo/fswatch
.. _Read the Docs: http://readthedocs.org
.. _ReStructuredText: http://docutils.sourceforge.net/rst.html
.. _Sphinx: http://sphinx-doc.org/
.. _tutorial plugin: app/plugins/tutorial
