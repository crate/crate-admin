===============
Developer Guide
===============

Prerequisites
=============

You will need Python 3.5 installed.

To create the screenshots, you will need ImageMagick installed.

You can install ImageMagick on Mac OS X with Homebrew::

    $ brew install imagemagick

Setup
=====

Bootstrap the project::

    $ python bootstrap.py
    $ bin/buildout -N

Install the package dependencies::

    $ bin/npm install
    $ bin/bower install

Building the App
================

Build the app like so::

    $ bin/grunt build

To run the admin UI as a standalone app, open the ``dist/index.html`` file in
your browser.

Running the App for Development
===============================

Start the development server on port ``9000``::

    $ bin/grunt server

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

Running Tests
=============

You can run the tests like so::

    $ bin/grunt test

Plugins
=======

On startup, the ``conf/plugins.json`` file is read and plugins
(Angular modules) are loaded.

The `tutorial plugin`_ is loaded by the default configuration.

Updating the Screenshots
========================

This repository contains four screenshots:

- ``crate-admin-1-overview.png``
- ``crate-admin-2-console.png``
- ``crate-admin-3-tables.png``
- ``crate-admin-4-nodes.png``

The ``crate-admin.gif`` file is an animated GIF that combines each of the above
screenshots in sequence for the purposes of display in both the ``README.rst``
file in this repository, but more importantly, the ``README.rst`` file in the
main CrateDB repository.

You can recreate the animated GIF with ImageMagik like so::

    $ convert -delay 500 -loop 0 crate-admin-*.png crate-admin.gif

When doing a release, it's important to check whether the visual appearance of
the admin UI has changed in a way that would affect these screenshots. If so,
please update all four of them together (for consistency) and recreate the
animated GIF.

Please make sure to:

- Crop out browser chrome
- Keep the dimensions of your browser window the same between screenshots

**IMPORTANT**: After you have updated the screenshots, you must copy the new
``crate-admin.gif`` file to the root directory of the `crate/crate`_ repository
and create a pull request to merge the change into ``master``.

Preparing a Release
===================

Before releasing, run through the `Admin UI Release Preflight`_.

To create a new release, you must:

- Update the screenshots if necessary (see above)

- Add the new version to ``bower.json`` and ``package.json``

- Add a section for the new version in the ``CHANGES.txt`` file

- Commit your changes with a message like "prepare release x.y.z"

- Push to origin

- Create a tag by running ``./devtools/create_tag.sh``

- Run the ``crate-admin_release`` job in Jenkins

.. _Admin UI Release Preflight: https://github.com/crate/crate-admin/wiki/Admin-UI-Release-Preflight
.. _CrateDB configuration: https://crate.io/docs/reference/configuration.html
.. _tutorial plugin: app/plugins/tutorial
.. _crate/crate: https://github.com/crate/crate
