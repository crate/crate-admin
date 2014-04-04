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

Install ``npm`` and ``bower`` using the buildout commands::

    python boostrap.py

    bin/buildout -N

To bootstrap the app simply run ``npm`` and ``bower`` in this crate-admin folder::

    bin/npm install

    bin/bower install

Create distribution::

    bin/grunt build

Run standalone distribution from dist folder in the browser::

    open ./dist/index.html?base_uri=http://localhost:4200

.. _Crate Data: https://github.com/crate/crate

Help & Contact
==============

Do you have any questions? Or suggestions? We would be very happy
to help you. So, feel free to swing by our IRC channel #crate on Freenode_.
Or for further information and official contact please
visit `https://crate.io/ <https://crate.io/>`_.

.. _Freenode: http://freenode.net

License
=======

Copyright 2013-2014 CRATE Technology GmbH ("Crate")

Licensed to CRATE Technology GmbH ("Crate") under one or more contributor
license agreements.  See the NOTICE file distributed with this work for
additional information regarding copyright ownership.  Crate licenses
this file to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.  You may
obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
License for the specific language governing permissions and limitations
under the License.

However, if you have executed another commercial license agreement
with Crate these terms will supersede the license and you may use the
software solely pursuant to the terms of the relevant commercial agreement.
