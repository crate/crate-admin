==================================
CrateDB Admin UI Monitoring Plugin
==================================

The CrateDB Admin UI monitoring plugin allows you to monitor the average number
and speed of ``SELECT``, ``INSERT``, ``UPDATE``, and ``DELETE`` queries.

Installation
============

For this plugin to work properly, make sure the ``/conf/plugins.json`` file
contains the following:

.. code-block:: json

    {
      "enabled": true,
      "name":   "monitoring",
      "uri": "plugins/monitoring/monitoring.js",
      "stylesheet": "plugins/monitoring/monitoring.css",
      "routing": {
        "/monitoring": {
          "templateUrl": "plugins/monitoring/monitoring.html",
          "controller": "MonitoringController"
        }
      }
    }

Usage
=====

The *Monitoring* tab will now be visible in the side navigation bar of the admin
UI.
