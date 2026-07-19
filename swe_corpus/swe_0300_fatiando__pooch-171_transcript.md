# SWE trajectory 300
instance_id: fatiando__pooch-171
model: swe-agent-llama-70b
target: True
## [system]
SWE-agent shell interface (boilerplate omitted)
## [user-observation]
We're currently solving the following issue within our repository. Here's the issue text:
ISSUE:
Crash on import when running in parallel
**Description of the problem**
<!--
Please be as detailed as you can when describing an issue. The more information
we have, the easier it will be for us to track this down.
-->
We recommend a workflow of keeping a `Pooch` as a global variable by calling `pooch.create` at import time.
This is problematic when running in parallel and the cache folder has not been created yet.
Each parallel process/thread will try to create it at the same time leading to a crash.
For our users, this is particularly bad since their packages crash on `import` even if there is no use of the sample datasets.
Not sure exactly what we can do on our end except:
1. Add a warning in the docs about this issue.
2.
Change our recommended workflow to wrapping `pooch.create` in a function.
This way the crash wouldn't happen at `import` but only when trying to fetch a dataset in parallel.
This gives packages a chance to warn users not to load sample data for the first time in parallel.
Perhaps an ideal solution would be for Pooch to create the cache folder at install time. But that would mean hooking into `setup.py` (which is complicated) and I don't know if we could even do this with conda.
**Full code that generated the error**
See scikit-image/scikit-image#4660
INSTRUCTIONS:
Now, you're going to solve this issue on your own.
Your terminal session has started and you're in the repository's root directory.
You can use any bash commands or the special interface to help you.
Edit all the files you need to and run any checks or tests that you want.
Remember, YOU CAN ONLY ENTER ONE COMMAND AT A TIME. You should always wait for feedback after every command.
When you're satisfied with all of the changes you've made, you can submit your changes to the code base by simply running the submit command.
Note however that you cannot use any interactive session commands (e.g. python, vim) in this environment, but you can write scripts and run them. E.g. you can write a python script and then run it with `python <script_name>.py`.
NOTE ABOUT THE EDIT COMMAND: Indentation really matters! When editing a file, make sure to insert appropriate indentation before each line!
IMPORTANT TIPS:
1. Always start by trying to replicate the bug that the issues discusses.
   If the issue includes code for reproducing the bug, we recommend that you re-implement that in your environment, and run it to make sure you can reproduce the bug.
   Then start trying to fix it.
   When you think you've fixed the bug, re-run the bug reproduction script to make sure that the bug has indeed been fixed.
   If the bug reproduction script does not print anything when it successfully runs, we recommend adding a print("Script completed successfully, no errors.") command at the end of the file,
   so that you can be sure that the script indeed ran fine all the way through.
2. If you run a command and it doesn't work, try running a different command. A command that did not work once will not work the second time unless you modify it!
3. If you open a file and need to get to an area around a specific line that is not in the first 100 lines, say line 583, don't just use the scroll_down command multiple times. Instead, use the goto 583 command. It's much quicker.
4.
If the bug reproduction script requires inputting/reading a specific file, such as buggy-input.png, and you'd like to understand how to input that file, conduct a search in the existing repo code, to see whether someone else has already don
Do this by running the command: find_file "buggy-input.png" If that doesn't work, use the linux 'find' command.
5.
Always make sure to look at the currently open file and the current working directory (which appears right after the currently open file).
The currently open file might be in a different directory than the working directory!
Note that some commands, such as 'create', open files, so they might change the current  open file.
6.
When editing files, it is easy to accidentally specify a wrong line number or to write code with incorrect indentation.
Always check the code after you issue an edit to make sure that it reflects what you wanted to accomplish.
If it didn't, issue another command to fix it.
(Open file: n/a)
(Current directory: /pooch)
bash-$
## [ai]
First, I need to understand the problem.
It seems that Pooch crashes on import when running in parallel because multiple processes try to create the cache folder at the same time.
To solve this issue, I need to find a way to prevent this simultaneous creation of the cache folder.
Let's start by looking at the documentation of Pooch to see if there's any recommended way to handle this situation.
```bash
ls -a
```
Let's see what files and directories are in the current directory. Maybe there's a doc or README file that can give me some information about this issue.
## [user-observation]
.
..
.azure-pipelines.yml
.codecov.yml
.coveragerc
.git
.gitattributes
.gitignore
.pylintrc
.stickler.yml
.travis.yml
AUTHORS.md
AUTHORSHIP.md
CITATION.rst
CODE_OF_CONDUCT.md
CONTRIBUTING.md
LICENSE.txt
MAINTENANCE.md
MANIFEST.in
Makefile
README.rst
__pycache__
data
doc
environment.yml
paper
pooch
pooch.egg-info
requirements-dev.txt
requirements.txt
setup.cfg
setup.py
versioneer.py
(Open file: n/a)
(Current directory: /pooch)
bash-$
## [ai]
I see a README.rst file, which is likely to contain information about how to use Pooch. Let's take a look at it.
```bash
open README.rst
```
Maybe there's some information in the README about how to handle parallel imports or how to prevent the cache folder creation issue.
## [user-observation]
[File: /pooch/README.rst (257 lines total)]
1:.. image:: https://github.com/fatiando/pooch/raw/master/doc/_static/readme-banner.png
2:    :alt: Pooch
3:
4:`Documentation <https://www.fatiando.org/pooch>`__ |
5:`Documentation (dev version) <https://www.fatiando.org/pooch/dev>`__ |
6:`Contact <http://contact.fatiando.org>`__ |
7:Part of the `Fatiando a Terra <https://www.fatiando.org>`__ project
8:
9:.. image:: https://img.shields.io/pypi/v/pooch.svg?style=flat-square
10:    :alt: Latest version on PyPI
11:    :target: https://pypi.python.org/pypi/pooch
12:.. image:: https://img.shields.io/conda/vn/conda-forge/pooch.svg?style=flat-square
13:    :alt: Latest version on conda-forge
14:    :target: https://github.com/conda-forge/pooch-feedstock
15:.. image:: https://img.shields.io/travis/fatiando/pooch/master.svg?style=flat-square&label=TravisCI
16:    :alt: TravisCI build status
17:    :target: https://travis-ci.org/fatiando/pooch
18:.. image:: https://img.shields.io/azure-devops/build/fatiando/cb775164-4881-4854-81fd-7eaa170192e0/6/master.svg?label=Azure&style=flat-square
19:    :alt: Azure Pipelines build status
20:    :target: https://dev.azure.com/fatiando/pooch/_build
21:.. image:: https://img.shields.io/codecov/c/github/fatiando/pooch/master.svg?style=flat-square
22:    :alt: Test coverage status
23:    :target: https://codecov.io/gh/fatiando/pooch
24:.. image:: https://img.shields.io/pypi/pyversions/pooch.svg?style=flat-square
25:    :alt: Compatible Python versions.
26:    :target: https://pypi.python.org/pypi/pooch
27:.. image:: https://img.shields.io/badge/doi-10.21105%2Fjoss.01943-blue.svg?style=flat-square
28:    :alt: Digital Object Identifier for the JOSS paper
29:    :target: https://doi.org/10.21105/joss.01943
30:
31:
32:.. placeholder-for-doc-index
33:
34:🚨 **Python 2.7 is no longer supported. Use Pooch <= 0.6.0 if you need 2.7 support.** 🚨
35:
36:
37:About
38:-----
39:
40:*Does your Python package include sample datasets? Are you shipping them with the code?
41:Are they getting too big?*
42:
43:Pooch is here to help! It will manage a data *registry* by downloading your data files
44:from a server only when needed and storing them locally in a data *cache* (a folder on
45:your computer).
46:
47:Here are Pooch's main features:
48:
49:* Pure Python and minimal dependencies.
50:* Download a file only if necessary (it's not in the data cache or needs to be updated).
51:* Verify download integrity through SHA256 hashes (also used to check if a file needs to
52:  be updated).
53:* Designed to be extended: plug in custom download (FTP, scp, etc) and post-processing
54:  (unzip, decompress, rename) functions.
55:* Includes utilities to unzip/decompress the data upon download to save loading time.
56:* Can handle basic HTTP authentication (for servers that require a login) and printing
57:  download progress bars.
58:* Easily set up an environment variable to overwrite the data cache location.
59:
60:*Are you a scientist or researcher? Pooch can help you too!*
61:
62:* Automatically download your data files so you don't have to keep them in your GitHub
63:  repository.
64:* Make sure everyone running the code has the same version of the data files (enforced
65:  through the SHA256 hashes).
66:
67:
68:Example
69:-------
70:
71:For a **scientist downloading a data file** for analysis:
72:
73:.. code:: python
74:
75:    from pooch import retrieve
76:
77:
78:    # Download the file and save it locally. Running this again will not cause
79:    # a download. Pooch will check the hash (checksum) of the downloaded file
80:    # against the given value to make sure it's the right file (not corrupted
81:    # or outdated).
82:    fname = retrieve(
83:        url="https://some-data-server.org/a-data-file.nc",
84:        known_hash="md5:70e2afd3fd7e336ae478b1e740a5f08e",
85:    )
86:
87:
88:For **package developers** including sample data in their projects:
89:
90:.. code:: python
91:
92:    """
93:    Module mypackage/datasets.py
94:    """
95:    import pkg_resources
96:    import pandas
97:    import pooch
98:
99:    # Get the version string from your project. You have one of these, right?
100:    from . import version
(157 more lines below)
(Open file: /pooch/README.rst)
(Current directory: /pooch)
bash-$
## [ai]
It looks like the README file is quite extensive, but it doesn't seem to mention anything about handling parallel imports or preventing the cache folder creation issue.
Let's try to find the code that creates the cache folder. Since Pooch is a Python package, the code is likely to be in a Python file. Let's search for a file that might contain the relevant code.
```bash
find_file "cache"
```
Maybe this will find a file that has something to do with creating the cache folder.
## [user-observation]
No matches found for "cache" in /pooch
(Open file: /pooch/README.rst)
(Current directory: /pooch)
bash-$
## [ai]
No matches found for "cache".
That's okay, let's try a different approach.
Since Pooch is a Python package, the code that creates the cache folder is likely to be in a Python file inside the "pooch" directory.
Let's take a look at the files inside the "pooch" directory.
```bash
ls pooch
```
Maybe this will give us a better idea of where to look.
## [user-observation]
__init__.py
_version.py
core.py
downloaders.py
processors.py
tests
utils.py
version.py
(Open file: /pooch/README.rst)
(Current directory: /pooch)
bash-$
## [ai]
The "pooch" directory contains several Python files. The one that catches my eye is "core.py". This file might contain the core functionality of Pooch, including the code that creates the cache folder. Let's take a look at this file.
```bash
open pooch/core.py
```
Maybe this will give us a better understanding of how Pooch handles cache folder creation.
## [user-observation]
[File: /pooch/pooch/core.py (733 lines total)]
1:"""
2:The main Pooch class and a factory function for it.
3:"""
4:import contextlib
5:import os
6:from pathlib import Path
7:import shutil
8:import ftplib
9:
10:import requests
11:from .utils import (
12:    check_version,
13:    parse_url,
14:    get_logger,
15:    make_local_storage,
16:    hash_matches,
17:    temporary_file,
18:    os_cache,
19:    unique_file_name,
20:    file_hash,
21:)
22:from .downloaders import choose_downloader
23:
24:
25:def retrieve(url, known_hash, fname=None, path=None, processor=None, downloader=None):
26:    """
27:    Download and cache a single file locally.
28:
29:    Uses HTTP or FTP by default, depending on the protocol in the given *url*.
30:    Other download methods can be controlled through the *downloader* argument
31:    (see below).
32:
33:    The file will be downloaded to a temporary location first and its hash will
34:    be compared to the given *known_hash*. This is done to ensure that the
35:    download happened correctly and securely. If the hash doesn't match, the
36:    file will be deleted and an exception will be raised.
37:
38:    If the file already exists locally, its hash will be compared to
39:    *known_hash*. If they are not the same, this is interpreted as the file
40:    needing to be updated and it will be downloaded again.
41:
42:    You can bypass these checks by passing ``known_hash=None``. If this is
43:    done, the SHA256 hash of the downloaded file will be logged to the screen.
44:    It is highly recommended that you copy and paste this hash as *known_hash*
45:    so that future downloads are guaranteed to be the exact same file. This is
46:    crucial for reproducible computations.
47:
48:    If the file exists in the given *path* with the given *fname* and the hash
49:    matches, it will not be downloaded and the absolute path to the file will
50:    be returned.
51:
52:    .. note::
53:
54:        This function is meant for downloading single files. If you need to
55:        manage the download and caching of several files, with versioning, use
56:        :func:`pooch.create` and :class:`pooch.Pooch` instead.
57:
58:    Parameters
59:    ----------
60:    url : str
61:        The URL to the file that is to be downloaded. Ideally, the URL should
62:        end in a file name.
63:    known_hash : str
64:        A known hash (checksum) of the file. Will be used to verify the
65:        download or check if an existing file needs to be updated. By default,
66:        will assume it's a SHA256 hash. To specify a different hashing method,
67:        prepend the hash with ``algorithm:``, for example
68:        ``md5:pw9co2iun29juoh`` or ``sha1:092odwhi2ujdp2du2od2odh2wod2``. If
69:        None, will NOT check the hash of the downloaded file or check if an
70:        existing file needs to be updated.
71:    fname : str or None
72:        The name that will be used to save the file. Should NOT include the
73:        full the path, just the file name (it will be appended to *path*). If
74:        None, will create a unique file name using a combination of the last
75:        part of the URL (assuming it's the file name) and the MD5 hash of the
76:        URL. For example, ``81whdo2d2e928yd1wi22-data-file.csv``. This ensures
77:        that files from different URLs never overwrite each other, even if they
78:        have the same name.
79:    path : str or PathLike or None
80:        The location of the cache folder on disk. This is where the file will
81:        be saved. If None, will save to a ``pooch`` folder in the default cache
82:        location for your operating system (see :func:`pooch.os_cache`).
83:    processor : None or callable
84:        If not None, then a function (or callable object) that will be called
85:        before returning the full path and after the file has been downloaded
86:        (if required). See :meth:`pooch.Pooch.fetch` for details.
87:    downloader : None or callable
88:        If not None, then a function (or callable object) that will be called
89:        to download a given URL to a provided local file name. By default,
90:        downloads are done through HTTP without authentication using
91:        :class:`pooch.HTTPDownloader`. See :meth:`pooch.Pooch.fetch` for
92:        details.
93:
94:    Returns
95:    -------
96:    full_path : str
97:        The absolute path (including the file name) of the file in the local
98:        storage.
99:
100:    Examples
(633 more lines below)
(Open file: /pooch/pooch/core.py)
(Current directory: /pooch)
bash-$
## [ai]
The core.py file contains a lot of code, but I think I found the relevant part.
The `retrieve` function seems to be the one that downloads and caches a single file locally.
It uses the `make_local_storage` function from the utils module to create the cache folder.
Let's take a look at the `make_local_storage` function to see how it creates the cache folder.
```bash
open pooch/utils.py
```
Maybe this will give us a better understanding of how the cache folder is created and how we can prevent the simultaneous creation issue.
## [user-observation]
[File: /pooch/pooch/utils.py (436 lines total)]
1:"""
2:Misc utilities
3:"""
4:import logging
5:import os
6:import tempfile
7:from pathlib import Path
8:import hashlib
9:from urllib.parse import urlsplit
10:from contextlib import contextmanager
11:
12:import appdirs
13:from packaging.version import Version
14:
15:
16:LOGGER = logging.Logger("pooch")
17:LOGGER.addHandler(logging.StreamHandler())
18:
19:
20:def get_logger():
21:    r"""
22:    Get the default event logger.
23:
24:    The logger records events like downloading files, unzipping archives, etc.
25:    Use the method :meth:`logging.Logger.setLevel` of this object to adjust the
26:    verbosity level from Pooch.
27:
28:    Returns
29:    -------
30:    logger : :class:`logging.Logger`
