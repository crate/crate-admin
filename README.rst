==========================
Crate Data Admin Interface
==========================

A slick admin interface for `Crate Data`_.

``"Crate Data is a shared nothing, fully searchable, document oriented
cluster datastore."``

Set up from source
==================

This project uses buildout to set up all requirements.
As of now, you only need `bower <http://bower.io/>`_.

If you already have installer ``bower`` skip the following steps::

    python boostrap.py

    bin/buildout -N

To build the app simply run ``bower`` in this crate-admin folder::

    bin/bower install

Or if you haven't used ``buildout`` and installed ``bower`` globally::

    bower install

.. _Crate Data: https://github.com/crate/crate
