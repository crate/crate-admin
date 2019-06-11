===============
Developer Guide
===============

Prerequisites
=============

You will need Python 3.5 installed.

Setup
=====

Installing node locally::

    $ /usr/bin/python3 -m venv env
    $ source env/bin/activate
    $ python -m pip install -U pip
    $ python -m pip install nodeenv
    $ nodeenv  --node=10.16.0 -p

Install the package dependencies::

    $ env/bin/npm install

Building the App
================

Build the app like so::

    $ env/bin/npm run-script build

To run the admin UI as a standalone app, open the ``build/index.html`` file in
your browser.

Running the App for Development
===============================

Start the development server on port ``9000``::

    $ env/bin/npm start

You should now be able to access the app at: http://localhost:9000/

Connecting to CrateDB
=====================

You will need to enable *Cross-Origin Resource Sharing* in your
`CrateDB configuration`_ to test the admin UI against it::

    http.cors.enabled: true
    http.cors.allow-origin: "*"

You can then use the ``base_uri`` parameter to specify the URL of your CrateDB
node, like so::

    http://localhost:9000/?base_uri=http://localhost:4200

This  ``base_uri`` parameter is intended for development use only.

Adding New Dependencies
=======================

Application dependencies should be added as follow::

    $ env/bin/npm install [dependency] --save

This dependency should then be imported in ``./app/vendor.module.js``,
for the application to load correctly.

If the dependency is an angular module, it should also be included in ``MODULES``
in ``./app/app.module.js``

Dev dependencies should be added as follow::

    $ env/bin/npm install [dependency] --save-dev

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

    $ env/bin/npm test

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

Writing Documentation
=====================


The docs live under the ``docs/`` directory.

The docs are written with ReStructuredText_ and processed with Sphinx_.

First, install the additional dependencies by running::

    $ pip install -Ur requirements-docs.txt

Then build the documentation by running::

    $ env/bin/sphinx-build -b html docs out

The output can then be found in the ``/out/html/`` directory.

The docs are automatically built from Git by `Read the Docs`_ and there is
nothing special you need to do to get the live docs to update.

.. _Admin UI Release Preflight: https://github.com/crate/crate-admin/wiki/Admin-UI-Release-Preflight
.. _CrateDB configuration: https://crate.io/docs/reference/configuration.html
.. _Read the Docs: http://readthedocs.org
.. _ReStructuredText: http://docutils.sourceforge.net/rst.html
.. _Sphinx: http://sphinx-doc.org/
.. _tutorial plugin: app/plugins/tutorial
