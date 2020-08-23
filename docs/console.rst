.. _sql-console:

===========
SQL console
===========

The :ref:`CrateDB Admin UI <index>` comes with an *SQL console* so that you can
execute queries against your cluster directly from your web browser.

.. rubric:: Table of contents

.. contents::
   :local:


.. _console-screenshots:

Screenshots
===========

When you first load the console, it will look like this:

.. image:: _assets/img/console-default.png

And here's what the console looks like after executing a query:

.. image:: _assets/img/console-query.png


.. _console-features:

Features
========

.. _console-syntax-highlighting:

**Syntax highlighting**:
  CrateDB SQL syntax highlighted as you type.

.. _console-auto-completion:

**Auto-completion**:
  CrateDB SQL auto-completion makes suggestions as you type.

.. _console-results-formatting:

**Results formatting**:
  Toggle the *Format results* checkbox to switch between raw JSON and tabulated
  data.

.. _console-query-history:

**Query history**:
  Toggle the *Store console history persistently* to disable and enable query
  history. Previous queries can be cycled through by pressing the :kbd:`Up
  Arrow` key. You can clear your query history by selecting the *Clear history*
  button.

.. _console-query-urls:

**Query URLs**:
  Select the *share* icon located in the bottom right-hand corner of the query
  panel. This will copy a URL to your clipboard that can be saved or shared that
  will auto-load the corresponding query when visited. Queries are not
  automatically executed when you visit a URL.

.. _console-error-traces:

**Error traces**:
  Toggle the *Show error trace* checkbox to view a detailed Java stack trace in
  the event of an execution error.
