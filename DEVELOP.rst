===========
DEVELOPMENT
===========

Prerequisites
=============

If you don't have ``npm`` and ``bower`` installed globally you
can setup a local dev enviroment using buildout.
You need to have ``python`` installed to do that.

As of now, you only need `bower <http://bower.io/>`_.

Create dev enviroment using buildout
------------------------------------

If you already have installed ``bower`` you can skip the following steps::

    python bootstrap.py

    bin/buildout -Nv

Build the app
-------------

To build the app simply run ``npm`` and ``bower`` in this crate-admin folder::

    bin/npm install

    bin/bower install

Or if you haven't used ``buildout`` and installed ``npm`` and ``bower`` globally::

    npm install

    bower install

Run the app for development
---------------------------

Start the development server on port ``9000``::

    bin/grunt server

Then enable Cross Origin Resource Sharing in your crate configuration to test
the admin ui against crate::

    http.cors.enabled: true
    http.cors.allow-origin: "*"

Then visit the browser on ``http://localhost:9000/?base_uri=http://localhost:4200``.

To run the tests::

    bin/grunt test

Inject Plugins
==============

On app start the file ``conf/plugins.json`` is loaded, where additional plugins
(Angular modules) can be defined.

The "Get Started" tutorial is now loaded as a plugin.


Distributing
============

Before creating a new distribution, you need to create a new version tag

 - Add the new version to ``bower.json`` and ``package.json``.

 - Add a note for the new version into the ``CHANGES.txt`` file.

 - Commit e.g. using message 'prepare release x.x.x'.

 - Push to origin on the master branch.

 - Create a tag using the ``create_tag.sh`` script
   (run ``./devtools/create_tag.sh``).

 - Run crate-admin_release job in jenkins
