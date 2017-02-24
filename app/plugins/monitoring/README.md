# CrateDB Admin UI Monitoring Plugin

Crate-Admin-Monitoring is a plugin for the [CrateDB](https://crate.io)
[Admin Interface](https://github.com/crate/crate-admin). It allows for the monitoring
of the average number and speed of CrateDB queries (`SELECT`, `INSERT`, `UPDATE`
and `DELETE`).

## Setup and Usage

### Installation

Run the `install_plugin.py` script and pass in the path to your Admin Interface
installation folder:

`python3 install_plugin.py "/crate/app/build/install/crate/plugins/crate-admin/_site/"`

The script will migrate the plugin's files and append the plugin's config to `plugins.json`.

### Usage

The *Monitoring* tab will now be visible in the side navigation bar of the Admin
Interface.
