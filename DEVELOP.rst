===========
DEVELOPMENT
===========

Prerequisites
=============

This project uses buildout to manage its dependencies.
Be sure have a working ``python 2.7`` installed.

Set up from source
==================

This project uses buildout to set up all requirements.
As of now, you only need `bower <http://bower.io/>`_.

If you already have installer ``bower`` skip the following steps::

    python boostrap.py

    bin/buildout -N

To build the app simply run ``npm`` and ``bower`` in this crate-admin folder::

    bin/npm install

    bin/bower install

Or if you haven't used ``buildout`` and installed ``npm`` and ``bower`` globally::

    npm install

    bower install

Start the development server on port ``9000``::

    bin/grunt server

Then enable Cross Origin Resource Sharing in your crate configuration to test
the admin ui against crate::

    http.cors.enabled:true

Then visit the browser on ``http://localhost:9000/?base_uri=http://localhost:4200``.


Distributing
============

Before creating a new distribution, a new version and tag should be created:

 - Add a new version to ``bower.json`` and ``package.json``.

 - Add a note for the new version at the ``CHANGES.txt`` file.

 - Commit e.g. using message 'prepare release x.x.x'.

 - Push to origin on the master branch.

 - Create a tag using the ``create_tag.sh`` script
   (run ``./devtools/create_tag.sh``).
