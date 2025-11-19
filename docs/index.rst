.. _index:

====================
The CrateDB Admin UI
====================

CrateDB ships with a web administration user interface (aka *Admin UI*)
that you can use to inspect and interact with any CrateDB cluster. 

.. NOTE::

   The tool is primarily intended for self-hosted clusters and
   mirrors the relevant features of the CreateDB Cloud Console. Cloud
   users can also benefit from the Admin UI by using it to view
   :ref:`shards <shards-browser>` or to provide console access to users
   without full admin access to the Cloud Console.

Connecting
==========

The Admin UI runs on every CrateDB node and can be accessed on port
``4200``::

  http://HOSTNAME:4200/

Replace ``HOSTNAME`` with the hostname of the CrateDB node. If CrateDB is
running locally, this will be ``localhost``.

Navigate to this URL in a web browser.


.. _index-navigating:

Navigating
==========

This is what the Admin UI looks like when it first loads:

.. image:: _assets/img/admin-ui.png

Take note of the `status bar`_ (at the top) and the `tabs`_ (down the left
side).


.. _index-status-bar:

Status bar
----------

Along the top of the screen, from left to right, the status bar shows:

- `Cluster name`_

- CrateDB version

- Number of nodes in the cluster

- Health checks

  - Data status

    - **Green** -- All data is replicated and available

    - **Yellow** -- Some records are unreplicated

    - **Red** -- Some data is unavailable

  - Cluster status:

    - **Green** -- Good configuration

    - **Yellow** -- Some configuration warnings

    - **Red** -- Some configuration errors

- Average cluster load (for the past 1 minute, 5 minutes, and 15 minutes)

- Settings and notifications menu


.. _index-tabs:

Tabs
----

.. toctree::
   :hidden:

   console
   tables
   views
   shards
   cluster
   monitoring
   privileges

On the left-hand side, from top to bottom, the tabs are:

- Overview screen

- :ref:`SQL console <sql-console>`
- :ref:`Tables browser <tables-browser>`
- :ref:`Views browser <views-browser>`
- :ref:`Shards browser <shards-browser>`
- :ref:`Cluster browser <cluster-browser>`
- :ref:`Monitoring overview <monitoring-overview>`
- :ref:`Privileges browser <privileges-browser>`


.. SEEALSO::

   The CrateDB Admin UI is an open source project and is `hosted on GitHub`_.


.. _Cluster name: https://crate.io/docs/crate/reference/en/latest/config/node.html#basics
.. _CrateDB Rest API: https://crate.io/docs/crate/reference/en/latest/interfaces/http.html
.. _hosted on GitHub: https://github.com/crate/crate-admin
