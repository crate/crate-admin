==========================
Crate Data Admin Interface
==========================

A slick admin interface build as a plugin for `Crate Data`_.

``"Crate Data is a shared nothing, fully searchable, document oriented
cluster datastore."``

Crate Data...

- is a document oriented data store.

- has the ability to scale horizontally extremely well.

- forms a cluster and handles replicas for you.

- offers SQL to query and manage documents.

- lets you specify a schema

  - to define tables

  - and data types.

- offers support to manage BLOBs.


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


Creating the plugin
===================

Create a Crate Data plugin is easy.

Simply run following command::

    bin/plugin

If you want the plugin archived as a `tarball` run the following command::

    bin/pluginTar

**Bear in mind**: As of now, the scripts do not check if you have a dirty work
space or uncommitted changes. It simply copies the content of the ``app``
folder to the ``out`` folder and prepares it.


.. _Crate Data: https://github.com/crate/crate
