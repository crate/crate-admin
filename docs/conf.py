from crate.theme.rtd.conf.crate_admin_ui import *

html_extra_path = []

# Disable version chooser.
html_context.update({
    "display_version": False,
    "current_version": None,
    "versions": [],
})
