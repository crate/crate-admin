=====================
Crate Admin Interface
=====================

A slick admin interface for `Crate`_.

``"Crate is a new breed of database to serve today’s mammoth data needs."``

.. note::

  The admin interface is bundled with every Crate distribution.
  There is no need to install it separately, except if you want to
  contribute to the project.

  The admin interface is accessible on port ``4200`` when Crate is running.
  For example::

    http://crate1.example.com:4200/admin/


Set up from source
==================

This project uses buildout to set up all requirements.
As of now, you only need `Bower`_.

Install ``npm`` and ``bower`` using the buildout commands::

    python bootstrap.py

    bin/buildout -N

To bootstrap the app simply run ``npm`` and ``bower`` in this crate-admin folder::

    bin/npm install

    bin/bower install

Create distribution::

    bin/grunt build

To run the Admin UI standalone simply open the ``index.html``
in the ``dist`` folder in your browser. To connect to a running Crate
instance that is not running on ``localhost:4200`` you can append
a ``base_uri`` parameter to the URL::

    file:///.../dist/index.html?base_uri=http://host.example.com:4200

However this is recommended only for development purposes!

Help & Contact
==============

Do you have any questions? Or suggestions? We would be very happy
to help you. So, feel free to swing by our IRC channel ``#crate`` on Freenode_.
Or for further information and official contact please
visit `https://crate.io`_.

License
=======

Copyright 2013-2015 CRATE Technology GmbH ("Crate")

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


.. _`Crate`: https://github.com/crate/crate
.. _`https://crate.io`: https://crate.io
.. _`Freenode`: http://freenode.net
.. _`Bower`: http://bower.io
