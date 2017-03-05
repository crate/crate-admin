# CrateDB Admin UI Monitoring Plugin

Crate-Admin-Monitoring is a plugin for the [CrateDB](https://crate.io)
[Admin Interface](https://github.com/crate/crate-admin). It allows for the monitoring
of the average number and speed of CrateDB queries (`SELECT`, `INSERT`, `UPDATE`
and `DELETE`).

## Setup and Usage

### Installation
For this plugin to work properly, make sure that `/conf/plugins.json` contains 
the following definition:

```
{
  "name": "monitoring",
  "uri": "plugins/monitoring/monitoring.js",
  "stylesheet": "plugins/monitoring/monitoring.css",
  "enterprise": true,
  "routing": {
    "/monitoring": {
      "templateUrl": "plugins/monitoring/monitoring.html",
      "controller": "MonitoringController"
    }
  }
}
```

### Usage

The *Monitoring* tab will now be visible in the side navigation bar of the Admin
Interface.
