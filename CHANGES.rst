=================================
Changes for Crate Admin Interface
=================================

Unreleased
==========

- Updated a few JavaScript dependencies


2022-06-21 1.22.1
=================

- Updated web fonts (removed Open Sans & SourceCodePro, added Inter & Roboto Mono)
- Adjusted link colors


2022-06-03 1.22.0
=================

- Update static assets with new colors and logo


2022-04-06 1.21.0
=================

- Added various keywords and data types to console highlighting.


2022-03-22 1.20.2
=================

- Fixed issues with release 1.20.1.


2022-03-17 1.20.1
=================

- Fixed duplicate entries in query history.


2021-09-27 1.20.0
=================

- Side-Navigation: Adjusted size slightly, added hover-effect on selected item,
  added border on active item and fixed monitoring icon

- Move Monitoring to Overview and remove dedicated section. Monitoring now
  always shows last 15 minutes of QPS and query duration in 10 sec intervals.
  Slightly adjusted appearance of graphs.


2021-09-29 1.19.2
=================

- Fix: Added ability to correctly display nested arrays in OBJECT(IGNORED) columns


2021-09-01 1.19.1
=================

- Use correct binary prefixes (e.g. KiB, MiB, GiB) for units of data in UI.
  No change in calculation.

- Fix generated queries for views containing identifiers that need to be quoted


2021-07-13 1.19.0
=================

Changes
-------

- Removed all analytics (UDC, Segment)

- Removed the "Notifications" section in the statusbar

- Removed min-width for columns in console to reduce scrolling

- Changed syntax highlighting in console. Keywords in double quotes are now longer
  highlighted. Types are highlighted with a different color.

- Activated codemirror code hints for keywords.

- Changed the look of the Scrollbar to appear more modern.

- Added length limit for ``varchar(n)`` and ``bit(n)`` types in table view.


2021-03-19 1.18.0
=================

Fixes
-----

- Removed misguided redirects which may lose queries currently being typed.

- Made language selection sticky.

- Fixed translations. French now works again.

- Fixed missing whitespace.

Changes
-------

- Improved usability of the "Console" page. The "submit query" button is now closer
  to the query statement.

- Improved translations once more.

- Aligned with license change. Enterprise features are now available to everyone.

- When navigating from table view to console, apply server-side ``quote_ident``
  function to get better usability for column names within the manifested SQL
  statement. Also, added appropriate newlines.


2020-10-12 1.17.0
=================

Fixes
-----

- Fixed uppercase spelling of 'HTTP Endpoint' in cluster view.

Changes
-------

- Removed the Tweet tutorial.

2020-07-01 1.16.0
=================

Changes
-------

- Added console results formatting for the new Time with timezone data type.

Fixes
-----

- Fixed an issue where a nested column with a space in it would not be
  identified as one, resulting in an incorrect query when using the
  'Query Table' feature.

2020/01/29 1.15.6
=================

Fixes
-----

- Fixed an issue that prevents the value for nested partitioned columns showing
  up in the table partitions overview.

- Fixed capitalization of ``Shards`` tab label

- Updated keywords list so that they are recognised and painted in red.

- Upgraded ``node-sass``'s minor version, which introduces no changes
  for the end user, but improves maintenance. See release notes here
  node_sass_release_notes_.

2019/11/22 1.15.5
=================

Fixes
-----

- Fixed an issue that caused a ``0`` value for the partitioned by column of a
  table to be displayed as ``NULL`` instead.

- Fixed an issue that caused the node health to not be displayed in the Cluster
  View when the node name was too large.

2019/11/06 1.15.4
=================

Fixes
-----

- Fixed an issue that caused the pagination ``Previous`` button to not display the
  whole list of results for that page in the Console view.

2019/09/26 1.15.3
=================

Fixes
-----

- Fixed an issue that caused the users list in the privileges tab to not displayed
  when the CrateDB Admin UI is not served from ``/``.

- Fixed an issue that caused the pagination button styling to break.

- Fixed an issue that caused the result table to display incorrect results in
  certain columns after clicking the pagination buttons.

- Fixed an issue that caused the Twitter tutorial to not start automatically
  after the login redirect.

2019/09/16 1.15.2
=================

Changes
-------

- Replaced the Slack icon with Discourse in the help section, updated nametags
  for all languages and translations for Spanish.


Fixes
-----

- Fixed the table/column display to no longer display all columns as being
  generated columns.


2019/07/10 1.15.1
=================

Fixes
-----

- Adapted a query for compatibility with the upcoming CrateDB 4.0 release.


2019/04/03 1.15.0
=================

Breaking Changes
----------------

- Adapted a query for compatibility with the upcoming CrateDB 4.0 release. This
  drops the compatibility with earlier CrateDB versions.


2019/03/25 1.14.0
=================

Changes
-------

- Updated CrateDB & CrateDB CE logo images.

Fixes
-----

- Fixed display of unlimited license expiry dates.

2019/03/22 1.13.0
=================

Changes
-------

- Removed usage of deprecated CrateDB cluster setting ``license.enterprise``.
  Use license information available under ``sys.cluster.license`` instead to
  distinguish between enterprise and community edition.

Fixes
-----

- Fixed an issue that caused timestamp to not be formatted correctly.

2019/03/20 1.12.0
=================

Changes
-------

- Updated the license display to include the maximum number of nodes a license
  is valid for.

2019/02/21 1.11.4
=================

Fixes
-----

- Fixed an issue that caused the monitoring graph diagrams to be cut off.

2018/12/18 1.11.3
=================

Fixes
-----

- Fixed an issue that caused incorrectness in the navigation icons highlighting.

- Updated the license div to be more responsive

2018/11/15 1.11.2
=================

Changes
-------

- Changed the license information (ident) to be taken from the `sys.cluster.licence`
  attribute instead of the `license.ident` setting which is `@deprecated`.

- Addition of French language files and menu options.

2018/11/08 1.10.4
=================

Fixes
-----

- Fixed an issue that caused the cluster and node checks to not be refreshed
  when clicking on the ``refresh`` icon.

- Fixed an issue that caused the Twitter importer to redirect to ``/``
  instead of ``/help``.

- Fixed the navigation component to allow opening URLs in new tabs.

2018/06/29 1.10.3
=================

Fixes
-----

- Fixed an issue where the configuration file for plugins was not loaded when
  the UI was served from another location than ``/`` resulting in a blank
  browser canvas.

2018/05/29 1.10.2
=================

Fixes
-----

- Fixed an issue that caused the CrateDB process CPU calculation to be false.

2018/05/14 1.10.1
=================

Fixes
-----

 - Show column data types in table schema in upper case.

 - Fixed interface glitches that occurred on table tab when the last table was
   dropped.

2018/05/14 1.10.0
=================

Changes
-------

 - Added a new tab for views which lists available views and their properties.

 - Updated ``information_schema.tables`` queries to return only tables, but not
   views, in order to be compatible with future versions of CrateDB.

2018/05/14 1.9.1
================

Fixes
-----

 - Fixed several bugs concerning filtering tables/views where table
   information would not be updated properly. Also fixed the clear filter
   button for both table and view filtering.

 - Removed abbreviations in the overview and table view. Updated nodes view.

 - Remove trailing space from column name in tables detail view.


2018/03/20 1.9.0
================

Changes
-------

 - Adapted queries to be compatible with CrateDB 3.0+

2018/03/19 1.8.4
================

Fixes
-----

 - Fixed handling of ``null`` values correctly in Cluster Tab of the Admin UI.

 - Updated the ``Size`` label in the table detail to ``Size (Sum of primary shards)``

2018/03/06 1.8.3
================

Fixes
-----

 - Updated the link to the stat collection in the monitoring plugin.

 - Updated the table list search to filter tables only by table name and table
   schema.

 - Fixed an issue that caused the table list to display wrong results.

2018/02/09 1.8.2
================

Fixes
-----

 - Fix an issue that caused the translation strings to not be loaded correctly.

2018/01/16 1.8.1
================

Fixes
-----

 - Fix an issue that caused the ``Cluster`` tab to not be loaded correctly.

 - Map the Tab key to insert spaces instead of a tab character.

 - Fixed an issue that caused the user name to not be displayed.

2017/12/l5 1.8.0
================

Changes
-------

 - Updated CPU usage graph to use the value provided by ``os['cpu']['used']``.
   The graph does not show system/user/idle/stolen values any more.

2017/12/14 1.7.4
================

Fixes
-----

 - Remove horizontal scroll from the console editor.

 - Console results pagination is reset to 1 after each execution.

 - Calculate "idle" process CPU usage correctly and show it in the
   "CrateDB CPU Usage" graph.

 - Fixed an issue that caused the Admin UI to not display any tables when the
   file system data are not fetchable.

 - Refresh Cluster Info after query execution in the console, to ensure that
   the cluster info is always up to date.

2017/11/13 1.7.3
================

Fixes
-----

 - The download url now links to the stable CrateDB version.

 - Replicates shards in the ``Unassigned`` row of the Shards view
   are now grouped by id.

 - Fixed issue that caused closed partitions to show a ``CRITICAL``
   data state.

2017/11/06 1.7.2
================

Fixes
-----

 - Remove horizontal scroll from the console editor.

 - show all nodes in admin ui shard view, even those which
   have no shards.

 - Fixed an issue that cause the statusbar to show an error
   if the user has an adblocker enabled.

 - Fixed an issue that caused extra spaces to be added
   to the formatted console results.

 - Fixed an issue that caused ``NULL`` generated column values
   not to be displayed in the tables view.

 - Show messages when in the Tables view when the table list is empty.

2017/10/20 1.7.1
================

Fixes
-----

 - Fixed an issue that delayed the overview chart's initial display.

 - Fixed issue that caused the redirect to ``/401`` in case of
   unauthorized access to fail.

 - Fixed casting issue in the Monitoring query.

 - Fixed issue that caused the cluster view to not redirect
   to the first node by default.

2017/10/17 1.7.0
================

Changes
-------

 - Added pagination to Console results.

2017/10/17 1.6.4
================

Fixes
-----

 - Keep input of console when changing tabs.

 - Added focus on textbox when the console view is loaded and after
   clicking on the `Execute Query` button.

 - Shard and node details are now loaded on demand in the shards view.

 - Fixed issue that caused the cluster check display to be delayed.

 - Fix formating of strings in the console view.

2017/10/10 1.6.3
================

Fixes
-----

 - Update position of the navigation menu elements.

 - Fixed left Join condition in shards query that previously caused
   duplicated shards to be displayed.

 - Added loading indicator in shards view.

 - Do not automatically execute the query when clicking on
   the "Query Table" button in the table view.

2017/09/26 1.6.2
================

Fixes
-----

 - Improve shards view performance

 - Remove horizontal scroll from the console editor.

2017/09/18 1.6.1
================

Fixes
-----

 - Fixed an issue that caused the tooltip to have a wrong position
   in the Shards view.

2017/09/18 1.6.0
================

Changes
-------

 - Added Shards plugin (Enterprise Feature). The shard
   plugin is a visualization that displays information about
   shards by table, partition and node.

 - Added query table to Tables view.

 - Implemented share query feature in the Console.

2017/09/18 1.5.3
================

Fixes
-----

 - Show generation expression for generated columns in Tables view.

 - Added the row count number to the query status in the Console view.

 - Fixed issue that caused the privileges view to not be scrollable.

 - Fixed typo in privileges view.

2017/08/29 1.5.2
================

Fixes
-----

 - Fixed empty ``account_user``-column in twitter tutorial plugin.

2017/08/23 1.5.1
================

Fixes
-----

 - Fixed issue that caused the Monitoring tab to redirect to ``/401`` when
   the user didn't have privileges for ``sys.cluster`` or ``sys.jobs_log``.

2017/08/23 1.5.0
================

Changes
-------

 - Added Privileges plugin (Enterprise Feature)

 - The documentation link now points to the documentation for the major.minor
   (e.g. 2.1) version of CrateDB, instead of major.minor.hotfix (e.g. 2.1.1).

2017/07/21 1.4.2
================

Fixes
-----

 - Fix Tweet import for Twitter tutorial page

2017/07/11 1.4.1
================

Fixes
-----

 - Add ``DENY`` keyword to the console autocapitalization.

 - Display error message on the Tutorial plugin when the SQL query fails.

 - Fixed the SQL query in the Tutorial plugin.

 - Fix timestamp formatting in the console results.

2017/07/10 1.4.0
================

Changes
-------

 - Display user name in the status bar when the Enterprise
   Edition is enabled.

2017/07/07 1.3.3
================

Fixes
-----

 - Cluster warning within the monitoring plugin, regarding
   stat collection being disabled, has been improved.

2017/07/07 1.3.2
================

Fixes
-----

 - Redirect to /401 when the admin-ui user does not have cluster privileges.

 - Expanded the list of keywords used by autocapitalization.

 - Fix toggle buttons UI, which was broken while zooming.

 - Change color of keywords in the console to be more readable.

 - Display long table names correctly.

2017/04/24 1.3.1
================

Fixes
-----

 - Licence ident wording has been corrected.

2017/04/18 1.3.0
================

 - Enterprise license ident is now displayed.

2017/04/12 1.2.3
================

 - Fixed ``y-axis`` number formating for long running queries
   in the monitoring plugin.

2017/03/28 1.2.2
================

 - Added ``ms`` to monitoring graph title.

 - Fixed issue where arrays in formatted objects were not displayed.

2017/03/27 1.2.1
================

 - Removed blog feed from side bar.

 - Increase base font size.

 - Fixed issue that caused tables to display a healthy status even though their
   partitions were in critical state

 - Added fallback to unformatted results if no column types are returned.

 - Display notification warning only when a new CrateDB version is released.

 - Added ``lineWrapping`` option to console Editor.

 - Fixed issue that cause the console text to appear on top of the settings tab.

 - Fixed load reading display when the readings were invalid (for example, on
   Windows).

2017/03/16 1.2.0
================

 - Added monitoring plugin (Enterprise Feature).

 - Added Lazy loading of the stylesheet and plugins depending on the enterprise
   settings.

 - Added buttons to collapse and expand all schemas in the tables view.

 - The console now expands vertically to show the whole query if its size is
   larger than the standard size of the console.

 - SQL console keywords are now CrateDB specific.

 - Improved formatted results of the ``geo_area`` datatype to include an
   external link to a visualisation of that ``geo_area``.

 - Keywords in the SQL console are capitalised.

2017/03/16 1.1.2
================

 - Added node number to the status bar.

 - Fixed issue that caused ``Cluster Offline`` message to not be displayed.

 - Fixed a console results issue that caused the results table not to be visible
   after horizontal scrolling.

 - Fixed styling issue that caused the last element in the side bar list to be
   hidden.

 - Fixed an issue that caused the notification date to be ``null`` in Safari.

2017/02/15 1.1.1
================

 - Fixed a console results issue that caused the results table not to be
   displayed after horizontal scrolling.

 - Fixed an issue that caused the Admin UI to load only one plugin.

 - Display warning in the console view when the query result contains an unsafe
   integer.

 - Relocated the help resources section to be underneath the tweet import
   tutorial.

 - Show loading indicator when ``Execute Query`` is in progress.

2017/01/11 1.1.0
================

 - BREAKING: Updated the admin UI build to be compatible with future crate
   versions which will serve the admin-ui from root `/`.

 - Improved console results table, including data type based colorization,
   alternating row colorization, structured object/array formatting,
   human-readable timestamps, Google Maps link on geo-point results & lazy
   loading on result sets larger than 100 rows.

2017/01/11 1.0.4
================

 - Fixed getting started display issue on very wide screens.

2017/01/02 1.0.3
================

 - Added compatibility with future crate versions which will serve
   the admin-ui from `/admin/` instead of `/_plugins/crate-admin/`.

2016/12/12 1.0.2
================

 - Removed pepper widget, support links are now in a Help section along width
   the Get Started tutorial.

 - Changed read notification behaviour so that all items are marked as
   read upon opening the settings.

 - Lowered opacity of placeholder query in the console.

 - Fix intercom support that disappeared during the implementation
   of the new admin-ui layout.

 - Fix Radio button position in load overview.

 - Made schema tabs more distinguishable from tables in the table list.

 - Updated link to support website in contact widget.

2016/12/02 1.0.1
================

 - Fixed an issue that caused incorrect URL paths if the project gets built.

2016/12/02 1.0.0
=================

 - Implemented new layout for the admin-ui.

 - Local development: do not store ``base_uri`` permanently in localStorage
   but keep it in URL.

 - Added Pepper contact widget which displays various Crate.IO
   support Channels in a user friendly way.

 - The first node in the node list is selected by default.

 - The first table in the table list is selected by default.

 - Developer news from crate.io website are now loaded correctly into newsfeed.

2016/11/22 0.21.3
=================

 - fixed bug that caused the cluster REST URL link in nodes view page to be unsafe.

2016/11/03 0.21.2
=================

 - fixed incorrect sql query for creating the tweets table in the tutorial.

2016/11/02 0.21.1
=================

 - Fix : Corrected the sql queries to display the table list in the tables view.

 - Corrected the sql query in the tutorial to fix the error that occured
   when tweets table was already created.

2016/10/27 0.21.0
=================

 - Added a button to clear the search field in the table list view.

 - Added Spanish translation.

2016/10/21 0.20.4
=================

 - Fix: removed chinese language from i18n configuration.

 - Fix: added english as a fallback language for translation files.

2016/10/18 0.20.3
=================

 - Fixed broken execute button in the console view.

 - Fix : Reduced the amount of log output to browser console when issuing SQL statements.

2016/10/12 0.20.2
=================

 - Fixed hyperlink on logo in navigation bar which incorreclty pointed to
   the Crate HTTP root.

2016/10/12 0.20.1
=================

 - Fixed the chart error that occured when navigating between the overview and other pages.

 - Fixed the logo URL which was not redirecting correctly.

 - Fixed an issue that caused the query history in the console view to be inconsistent.

2016/09/23 0.20.0
=================

 - Added a new console option to allow users to display the error trace when an error occurs.

 - Added translation for tutorial plugin. This enables support for i18n for any admin ui plugin.

2016/09/23 0.19.1
=================

 - Fix: number of underreplicated shards cannot be negative.

 - Fix: fixed menu order.

2016/08/22 0.19.0
=================

 - Display failing node checks on overview page and allow to dismiss them.

 - Added German translation.
   This change also enables the possibility for further i18n.

2016/06/03 0.18.1
=================

 - Resolve path to ``/_sql`` endpoint correctly when Crate is served at a
   different location than ``/``

2016/05/25 0.18.0
=================

 - Cluster check include now clickable links

 - Load additional links in menu dynamically from news feed

 - Fixed an issue which caused rendering errors in the node list if the cluster
   contains multiple nodes with the same name
   note: changes the url to the detail view of single nodes

 - Added UTM tokens to links that link to the Crate.IO blog

 - Updated news feed URL

 - Label the master node in the cluster node list

2016/02/15 0.17.1
=================

 - Fix: updated BlenderPro webfont
   This fixes CSS glitches in Firefox 44 which misinterpreted height of webfont.

 - Fix: The recent update of the shard calculation for relocating shards caused
   problems with partitioned tables showing incorrect table health.

 - Fix: Reading an undefined property while cluster is offline caused
   Javascript error.

 - Fix: Rename cluster check indicator on statusbar to ``Checks``.

 - Improved display of recovery percentage in table view

 - Fix: relocating shards where previously displayed as "underreplicated" shards
   causing a yellow cluster state while relocating was in progress

 - Fix: change in calculation of recovery percentage broke calculations for
   partitioned tables causing table partitions not showing up

 - Fix: now also include unassigned shards (as 0% recovered) in calculation of
   recovery percentage which is displayed per table.
   Previously it could show '100% recovery done' even if there were still
   unassigned shards.

2015/12/15 0.17.0
=================

 - Display current shard recovery status on table info page. It shows the
   percentage of done recovery.

 - Updated calculation of underreplicated shards/records to work with the
   change in Crate server where shards in sys.shards table have a more fine
   granular state now and relocating shards are listed, too.

2015/12/15 0.16.2
=================

 - fix: Unavailable dependency `angular-truncate` module caused blank Admin UI.
   Switched to `angular-truncate-2` now.

2015/11/27 0.16.1
=================

 - fix: column headers where not shown in result table on console page
   when two or more columns with the same name were selected

2015/11/16 0.16.0
=================

 - The table list is now fully searchable and sorted by table name within
   its schemas.

 - fix: charts are not correctly displayed in Microsoft Edge browser.

 - UDC: identify anonymous user with cluster id.
   Both user id and cluster id are anonymous traits.
   Note: You can disable UDC via the `udc.enabled` setting on the Crate server.

2015/10/30 0.15.3
=================

 - fix: REPLICATED DATA at the overview page showed incorrect percentage of
   of replicated data when number of undereplicated records was higher than
   number of total records

2015/10/20 0.15.2
=================

 - fixed a bug that displays partitions that are not related to the selected
   table in the table-list.

 - fixed a bug where cluster shows wrong state if the number of nodes gets
   smaller than the minimum master nodes.

2015/10/09 0.15.1
=================

 - fixed a visual bug that let an item in the node/table list partly disappear
   if scrolling gets enabled

 - fixed URL to download in dropdown that notifies about old Crate version

 - fixed a bug that displays a zero value as NULL value

2015/09/17 0.15.0
=================

 - display cluster checks on overview page

 - display relative Crate process CPU usage as bar chart and show number of
   cores per node

2015/09/17 0.14.5
=================

 - display ``NULL`` instead of empty cell in console results table

2015/09/07 0.14.4
=================

 - updated Intercom to support new messaging features. The Intercom service is
   disabled if UDC is disabled on the Crate server.

2015/08/06 0.14.3
=================

 - fixed line wrapping in console result table

2015/07/13 0.14.2
=================

 - added support for line breaks in console result table

2015/07/09 0.14.1
=================

 - fix: number of underreplicated shards were fetched and displayed incorrectly

2015/06/29 0.14.0
=================

 - load plugins.json that can inject additional modules on app start
   the "Get Started" tutorial is now implemented as a plugin

2015/06/23 0.13.4
=================

 - fix: approximate number of underreplicated and missing records per table was
   calculated incorrectly, which could have lead to different results
   when viewing table info on admin ui of different nodes

2015/06/22 0.13.3
=================

 - fix: automatically refresh load history chart on overview page

2015/06/15 0.13.2
=================

 - improved layout for smaller screens

 - fix: highlight cluster navigation item also when node is selected

 - fix: crate process cpu will now also display values greater than 100%

2015/06/09 0.13.1
=================

 - fix: load graph was not displayed when no tables where available

2015/06/09 0.13.0
=================

 - improved load graph on overview page

 - display load, cpu usage, disk i/o, process stats and shard information
   on node detail page

  - added columns with partition values on "Partitions" table
    on table detail view

2015/05/22 0.12.1
=================

  - update logo, favicons

2015/04/23 0.12.0
=================

  - display ``rest_url`` from sys.nodes table on node detail view

2015/04/09 0.11.5
=================

  - fix: concurrent ajax requests caused partition information
    in table detail view to be mixed up between tables

2015/03/05 0.11.4
=================

 - fix: calculate health for each partition of a partitioned table
   based on the number of shards of that partition

2015/02/04 0.11.3
=================

 - fixed bug that showed custom schemas in the table list
   as often as the amount of tables in that custom schema

2015/01/15 0.11.2
=================

 - removed usage of sys expressions in wrong context

 - fixed a template rendering issue in cluster view in Safari

 - de-register watches to decrease DOM updates and improve performance in cluster view

2014/12/19 0.11.1
=================

 - fixed title of `tables` view if no tables exists or connection is down

2014/12/16 0.11.0
=================

 - add support for tables with user defined schemas

 - added `Intercom <https://www.intercom.io>`_ integration
     Intercom allows you to ask questions and send messages to the Crate
     team directly from the admin interface. Click on the help button
     in the menu bar to enable personal support.
     Click on the icon in the bottom right corner to start writing your questions!

2014/11/17 0.10.2
=================

 - fixed issue that caused clunky scrolling with trackpad
   in Safari that mainly occured when having a narrow browser width

2014/11/14 0.10.1
=================

 - made console placeholder text darker so you can distinguish better
   between placeholder text and actually written statement

 - fixed 'Execute Query' button in console view

2014/11/06 0.10.0
=================

 - added hint to console: press shift+enter to submit query

 - fix: UI showed partitions from wrong table after switching between tables
   this could also lead to 'red' partitions if the newly selected table also had partitions

 - added syntax highlighting to sql console

2014/08/19 0.9.3
================

 - send cookies with cross-origin requests

2014/08/14 0.9.2
================

 - fix: display number of records and started shards correctly
   if table and blob table have the same name

2014/07/22 0.9.1
================

 - fix: do not append limit to insert by query statement

2014/07/05 0.9.0
================

 - use new sys.nodes.fs expression in order to
   calculate disk utilization of data disks correctly

2014/06/24 0.8.4
================

 - changed font in console for better readability

 - fixed ui glitch that caused right column content to be cut off

 - fix: include initializing shards in calculation for underreplicated shards

2014/06/24 0.8.3
================

 - fix: ui showed partitions from previously selected table

2014/06/06 0.8.2
================

 - fix: make table list and node list available in mobile view

2014/06/04 0.8.1
================

 - fix: round percentage of available and underreplicated data correctly

2014/06/04 0.8.0
================

 - make table that displays table partitions horizontally scrollable

 - display developer news notifications

2014/05/19 0.7.3
================

 - fix: prevent selected node/table item from being out of viewport

2014/05/15 0.7.2
================

 - improved handling of error responses from server

2014/05/08 0.7.1
================

 - changed doc url to match doc url pattern

2014/05/08 0.7.0
================

 - removed docs menu item from sidebar and added link to external docs in statusbar

 - make console history persistent by default

 - display crate version of each node and show warning if cluster contains multiple versions

 - display heap size instead of system memory in node detail view

2014/04/29 0.6.3
================

 - fix: make sure twitter import stops when user navigates away from tutorial view

 - fix: allow horizontal scrolling in console result table

2014/04/28 0.6.2
================

 - fixed broken redirect after twitter authentication in 'get started' section

2014/04/16 0.6.1
================

 - force vertical scrollbar to prevent content column from flickering

2014/04/16 0.6.0
================

 - support for partitioned tables

 - make node list sortable by health and name

 - display number of nodes in status bar

 - show node version number

 - added history support in admin console

2014/04/30 0.5.3
================

 - fix: make sure twitter import stops when user navigates away from tutorial view

 - fixed broken redirect after twitter authentication in 'get started' section

2014/04/14 0.5.2
================

 - fix: scrolling issues with node list/table list

 - fix: immediately show node list on browser refresh

2014/04/08 0.5.1
================

 - fix: sorting of cluster list

2014/04/08 0.5.0
================

 - display blob tables

 - fix: prevent logo from overlapping sidebar navigation

2014/04/08 0.4.4
================

 - fix: removed horizontal scrollbar in sidebar

2014/04/07 0.4.3
================

 - fix: UI glitch: load was off site

2014/04/07 0.4.2
================

 - fix: display values at overview if no table exists

 - fix: default base_uri is current location

2014/04/07 0.4.1
================

 - fixed Angular version

2014/04/07 0.4.0
================

 - ported from Backbone to Angular

2014/03/21 0.3.1
================

 - show correct cluster status immediately after starting the admin

 - compute correct numbers of missing primary shards and unassigned shards

2014/03/17 0.3.0
================

 - use sql to query clustername and nodes load

2014/03/13 0.2.9
================

 - removed note about yellow warning state in "get started"

2014/03/13 0.2.8
================

 - use '0-all' replicas in the twitter getting started tutorial

2014/03/13 0.2.7
================

 - Changed docs link to open in the same frame.

2014/03/11 0.2.6
================

 - Fix Safari font rendering

2014/03/11 0.2.5
================

 - Changed query to fetch table information. Group by wasn't necessary and sum
   on number_of_replicas won't work in the next crate version as it is changed
   to a string.

2014/03/07 0.2.4
================

 - Fix FF bug related to mixed-content on the tutorial view.

 - Do not abort table info fetching when a node goes down and /_sql does not respond.

2014/03/06 0.2.3
================

 - Remove obsolete code and refactor ClusterStatus, Overview.

2014/03/04 0.2.2
================

 - Filter system tables differently.

2014/03/04 0.2.1
================

 - Fix display issues

2014/03/04 0.2.0
================

 - Add a "Get started" section that imports tweets

 - Fix table ordering

2014/03/04 0.1.2
================

 - Insert new TableInfoView items in alphabetic order

2014/02/27 0.1.1
================

 - Fix TableInfoView when a displayed table is removed. Show/hide properly
   "No tables available" when a table is removed

2014/02/27 0.1.0
================

 - Handle edge case where there are no tables in overview, table view

 - Fix load graph to behave with bootstrap/jQuery

 - Allow for multiple views in the content area

2014/02/26 0.0.9
================

 - Fix visual glitches for different devices and screen widths

 - Show graph of load over time on Overview view

 - Handle add/remove events of nodes on the Cluster view

 - Handle add/remove events of tables on the TableList view

 - Use URL fragments for navigation, disable pushState

 - Sort tables and cluster nodes by health then alphabetically

2014/02/26 0.0.8
================

 - Update logo

 - Refactor top and left navbars

 - Cluster list: Stop highlighting node names

 - Improved responsive behaviour

 - Repaired visual style glitches

 - Refresh Table & Cluster views

 - Auto select first item in Table and Cluster views

 - Refresh Tables & Cluster views

 - Display json objects on sql results

2014/02/25 0.0.7
================

 - Completed table info view

 - Complete cluster view

 - fixed error console not reseting on a new query

2014/02/25 0.0.6
================

 - fixed visual bug causing table info to not display properly.

2014/02/24 0.0.5
================

 - Introduced Tables view

 - Introduced Cluster view

2014/02/24 0.0.4
================

 - bugfix in release management: create_tag.sh now checks for
   versions in both, package.json and bower.json.

2014/02/24 0.0.3
================

 - fix for overview

 - fixed status bar

 - bugfix in ./devtools/create_tag.sh

2014/02/23 0.0.2
================

 - initial project setup.


.. _node_sass_release_notes: https://github.com/sass/node-sass/releases/tag/v4.13.0
