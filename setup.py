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
# with Crate these terms will supersede the license and you may use the
# software solely pursuant to the terms of the relevant commercial agreement.

import os
from setuptools import setup, find_packages
import json

bowerJson = json.loads(open("bower.json").read())
if bowerJson:
    version = bowerJson.get('version')
else:
    raise RuntimeError('Unable to find version string')


def get_versions():
    return version


def read(path):
    return open(os.path.join(os.path.dirname(__file__), path)).read()


requires = [
    bowerJson.get('dependencies').keys()
]

test_requires = requires + [
    bowerJson.get('devDependencies').keys()
]

setup(name='crate-admin',
      version=version,
      description='Crate Admin UI',
      long_description='Crate Admin UI',
      classifiers=[
          "Programming Language :: JavaScript",
      ],
      author='CRATE Technology',
      author_email='office@crate.io',
      url='https://github.com/crate/crate-admin',
      keywords='crate admin ui',
      license='apache license 2.0',
      packages=find_packages(),
      namespace_packages=[],
      include_package_data=True,
      extras_require=dict(
          test=test_requires,
      ),
      zip_safe=False,
      install_requires=requires,
      tests_require=test_requires,
      test_suite="",
      )
