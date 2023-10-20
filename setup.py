# -*- coding: utf-8; -*-
#
# Licensed to CRATE Technology GmbH ("Crate") under one or more contributor
# license agreements.  See the NOTICE file distributed with this work for
# additional information regarding copyright ownership.  Crate licenses
# this file to you under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.  You may
# obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
# WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the
# License for the specific language governing permissions and limitations
# under the License.
#
# However, if you have executed another commercial license agreement
# with CrateDB these terms will supersede the license and you may use the
# software solely pursuant to the terms of the relevant commercial agreement.

import os
from setuptools import setup, find_packages
import json


package_json = json.loads(read("package.json"))
if package_json:
    version = package_json.get('version')
else:
    raise RuntimeError('Unable to find version string')


def get_versions():
    return version


def read(path: str) -> str:
    p = Path(os.path.dirname(__file__)) / path
    with open(p.resolve(), "r", encoding="utf-8") as fp:
        return fp.read()


setup(name='crate-admin',
      version=version,
      description='CrateDB Admin UI',
      long_description='CrateDB Admin UI',
      classifiers=[
          "Programming Language :: JavaScript",
      ],
      author='CRATE Technology',
      author_email='office@crate.io',
      url='https://github.com/crate/crate-admin',
      keywords='cratedb admin user interface ui sql',
      license='apache license 2.0',
      packages=find_packages(),
      namespace_packages=[],
      include_package_data=True,
      zip_safe=False,
      test_suite="",
      )
