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
      description='Crate Data Admin UI',
      long_description='Crate Data Admin UI',
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
