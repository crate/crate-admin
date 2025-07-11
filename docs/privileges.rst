.. _privileges-browser:

==================
Privileges browser
==================

The :ref:`CrateDB Admin UI <index>` comes with a *privileges browser* that
allows you to inspect `users`_ and `privileges`_.

When you first visit the privileges browser, the ``crate`` superuser will be
selected:

.. image:: _assets/img/privileges-superuser.png

By selecting a user from the list of all users in left-hand sub-navigation
menu, you can view the `privileges`_ that have been assigned to that `user`_:

.. image:: _assets/img/privileges-user.png

.. NOTE::

   The privileges browser is read-only.

   For the time being, `user administration`_ must be done manually.

.. _privileges-features:

Features
========

.. _privileges-user-list:

**User list**:
  The left-hand sub-navigation menu lists all users.

.. _privileges-user-filtering:

**User filtering**:
  You can enter text into the *Filter users* text input to only show users with
  a username that matches the entered text.

.. _privileges-permission-filtering:

**Permission filtering**:
  You can enter text into the *Filter privileges* text input to only show
  privileges with an column value that matches the entered text.


.. _privileges: https://crate.io/docs/crate/reference/en/latest/admin/privileges.html
.. _user administration: https://crate.io/docs/crate/reference/en/latest/admin/user-management.html
.. _user: https://crate.io/docs/crate/reference/en/latest/admin/user-management.html
.. _users: https://crate.io/docs/crate/reference/en/latest/admin/user-management.html
