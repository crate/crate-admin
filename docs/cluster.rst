.. _cluster-browser:

===============
Cluster browser
===============

The CrateDB admin UI comes with a *cluster browser* that allows you to inspect
all of the nodes that are in your `cluster`_.

.. rubric:: Table of contents

.. contents::
   :local:

Screenshot
==========

Here's what a single node cluster looks like:

.. image:: cluster-simple.png

In this example, there is one node named *Monte Civetta*. When selected from
the left-hand sub-navigation menu, information about a node is displayed.

Features
========

.. |nbsp| unicode:: 0xA0
   :trim:

The cluster browser features:

:Node |nbsp| listing:

  The list of nodes gives basic summary information for each node: node name,
  hostname, CrateDB version, and a visual icon indicating whether the node is a
  ``master node`` or not and the node :ref:`data status <status-bar>` health
  check.

:Node |nbsp| list |nbsp| ordering:

  The list of nodes can be ordered by name or node health.

:Detailed node information:

  Selecting a node from the node list will display details about that particular
  node.

The following subsections explain the detailed node information.

Overview
--------

:Name:

  The name of the node.

  CrateDB automatically names unnamed nodes.

:Hostname:

  The hostname of the node.

:CrateDB Version:

  The version of CrateDB the node is running.

  This is important information when performing a `rolling upgrade`_.

:REST URL:

  The URL of the node's `HTTP endpoint`_.

:CPU Usage:

  A visual indicator of system CPU utilization.

:Heap Usage:

  A visual indicator of allocated *Java Virtual Machine* (JVM) `heap`_
  utilization.

:Disk Usage:

  A visual indicator of system disk space utilization.

:CrateDB CPU Usage:

  A visual indicator of the CrateDB process CPU utilization.

Load
----

:1min:

  Average `load`_ over one minute.

:5min:

  Average load over five minutes.

:15min:

  Average load over fifteen minutes.

CPU cores
---------

:Cores:

  The number of CPU cores.

Shards
------

:Initializing:

  The number of :ref:`shards <shards-browser>` currently being initialized.

:Started:

  The number of started shards.

:Reallocating:

  The number of shards that are being moved to another node.

:Post Recovery:

  The number of shards that have been recovered but have not yet been started.

Disk operations
---------------

:Read:

  Total size of reads on the disk in bytes.

  This value is `deprecated`_.

:Write:

  Total size of writes on the disk in bytes.

  This value is `deprecated`_.

:Reads:

  Number of reads on the disk.

:Writes:

  Number of writes on the disk.

.. _cluster: https://crate.io/docs/crate/guide/en/latest/architecture/shared-nothing.html
.. _master node: https://crate.io/docs/crate/reference/en/latest/config/node.html#node-types
.. _rolling upgrade: https://crate.io/docs/crate/guide/en/latest/admin/rolling-upgrade.html
.. _HTTP endpoint: https://crate.io/docs/crate/reference/en/latest/interfaces/http.html
.. _heap: https://en.wikipedia.org/wiki/Java_virtual_machine#Generational_heap
.. _load: https://en.wikipedia.org/wiki/Load_(computing)
.. _deprecated: https://crate.io/docs/crate/reference/en/latest/admin/system-information.html#fs
