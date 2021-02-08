===============
Developer Guide
===============


Prerequisites
=============

You will need Python 3.


Setup
=====

Installing node locally::

    python3 -m venv .venv
    source .venv/bin/activate
    pip install -U pip
    pip install nodeenv
    nodeenv --python-virtualenv --node=14.15.4

Install the package dependencies::

    npm install


Building the App
================

Build the app like so::

    npm run build

To run the Admin UI as a standalone app, open the ``build/index.html`` file in
your browser.


Running the App for Development
===============================

Start the development server on port ``9000``::

    npm start

You should now be able to access the app at: http://localhost:9000/


Running CrateDB
===============

The quickest way to spin up an instance is probably to use Docker::

    docker run -it --rm --publish 4200:4200 crate/crate:nightly -Chttp.cors.enabled=true -Chttp.cors.allow-origin=*


Connecting to CrateDB
=====================

You will need to enable *Cross-Origin Resource Sharing* in your `CrateDB
configuration`_ to test the Admin UI against it::

    http.cors.enabled: true
    http.cors.allow-origin: "*"

You can then use the ``base_uri`` parameter to specify the URL of your CrateDB
node, like so::

    http://localhost:9000/?base_uri=http://localhost:4200

This  ``base_uri`` parameter is intended for development use only.


Adding New Dependencies
=======================

Application dependencies should be added as follow::

    npm install [dependency] --save

This dependency should then be imported in ``./app/vendor.module.js``,
for the application to load correctly.

If the dependency is an angular module, it should also be included in ``MODULES``
in ``./app/app.module.js``

Dev dependencies should be added as follow::

    npm install [dependency] --save-dev


Adding New Components
=====================

When a new component is created (a module or a service or a controller),
it should be imported to ``./app/app.components.js``.


Adding New Stylesheets
======================

When a new stylesheet is created it should be imported to
``./styles/styles.scss`` and/or ``./styles/styles-enterprise.scss``

Vendor styles should also be imported to ``./styles/styles.scss``
and ``./styles/styles-enterprise.scss``


Running Tests
=============

You can run the tests like so::

    npm test


Plugins
=======

On startup, the ``conf/plugins.json`` file is read and plugins
(Angular modules) are loaded.

The `tutorial plugin`_ is loaded by the default configuration.


Preparing a Release
===================

Before releasing, run through the `Admin UI Release Preflight`_.

To create a new release, you must:

- Add the new version to ``package.json``

- Add a section for the new version in the ``CHANGES.txt`` file

- Commit your changes with a message like "prepare release x.y.z"

- Push to origin

- Create a tag by running ``./devtools/create_tag.sh``

- Run the ``crate-admin_release`` job in Jenkins


Documentation
=============

The documentation is written using `Sphinx`_ and `ReStructuredText`_.


Working on the documentation
----------------------------

Python 3.7 is required.

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
-------------------------------------

|build| |travis| |rtd|

Travis CI is `configured`_ to run ``make check`` from the ``docs`` directory.
Please do not merge pull requests until the tests pass.

`Read the Docs`_ (RTD) automatically deploys the documentation whenever a
configured branch is updated.

To make changes to the RTD configuration (e.g., to activate or deactivate a
release version), please contact the `@crate/tech-writing`_ team.


.. _@crate/tech-writing: https://github.com/orgs/crate/teams/tech-writing
.. _Admin UI Release Preflight: https://github.com/crate/crate-admin/wiki/Admin-UI-Release-Preflight
.. _configured: https://github.com/crate/crate-admin/blob/master/.travis.yml
.. _CrateDB configuration: https://crate.io/docs/reference/configuration.html
.. _fswatch: https://github.com/emcrisostomo/fswatch
.. _Read the Docs: http://readthedocs.org
.. _ReStructuredText: http://docutils.sourceforge.net/rst.html
.. _Sphinx: http://sphinx-doc.org/
.. _tutorial plugin: app/plugins/tutorial


.. |build| image:: https://img.shields.io/endpoint.svg?color=blue&url=https%3A%2F%2Fraw.githubusercontent.com%2Fcrate%2Fcrate-admin%2Fmaster%2Fdocs%2Fbuild.json
    :alt: Build version
    :target: https://github.com/crate/crate-admin/blob/master/docs/build.json

.. |travis| image:: https://img.shields.io/travis/crate/crate-admin.svg?style=flat
    :alt: Travis CI status
    :target: https://travis-ci.org/crate/crate-admin

.. |rtd| image:: https://readthedocs.org/projects/crate-admin-ui/badge/?version=latest
    :alt: Read The Docs status
    :target: https://readthedocs.org/projects/crate-admin-ui
