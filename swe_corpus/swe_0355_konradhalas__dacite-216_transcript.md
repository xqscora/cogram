# SWE trajectory 355
instance_id: konradhalas__dacite-216
model: swe-agent-llama-70b
target: True
## [system]
SWE-agent shell interface (boilerplate omitted)
## [user-observation]
We're currently solving the following issue within our repository. Here's the issue text:
ISSUE:
Incorrect work when using field with default_factory
**Describe the bug**
`default_factory` is called only once if a field absent in the data
**To Reproduce**
```python
#!/usr/bin/env python
from dataclasses import field, dataclass
from dacite import from_dict
@dataclass
class A:
    name: str
    items: list[str] = field(default_factory=list)
if __name__ == '__main__':
    a1 = from_dict(A, {'name': 'a1'})
    a2 = from_dict(A, {'name': 'a2'})
    print('Test identity:', a1.items is a2.items)
```
**Output**
```
Test identity: True
```
**Expected behavior**
`items` shouldn't be identical.
`dacite v1.7.0` works as expected
```
Test identity: False
```
**Environment**
- Python version: 3.9.16
- `dacite` version: 1.8.0
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
(Current directory: /dacite)
bash-$
## [ai]
To start solving this issue, we need to reproduce the bug first. The issue includes some example code for reproduction, which we can use. We'll create a new file called `reproduce.py` and paste the example code into it.
```
create reproduce.py
```
## [user-observation]
[File: /dacite/reproduce.py (1 lines total)]
1:
(Open file: /dacite/reproduce.py)
(Current directory: /dacite)
bash-$
## [ai]
Now let's paste in the example code from the issue.
```
edit 1:1
#!/usr/bin/env python
from dataclasses import field, dataclass
from dacite import from_dict
@dataclass
class A:
    name: str
    items: list[str] = field(default_factory=list)
if __name__ == '__main__':
    a1 = from_dict(A, {'name': 'a1'})
    a2 = from_dict(A, {'name': 'a2'})
    print('Test identity:', a1.items is a2.items)
end_of_edit
```
## [user-observation]
[File: /dacite/reproduce.py (15 lines total)]
1:#!/usr/bin/env python
2:
3:from dataclasses import field, dataclass
4:
5:from dacite import from_dict
6:
7:@dataclass
8:class A:
9:    name: str
10:    items: list[str] = field(default_factory=list)
11:
12:if __name__ == '__main__':
13:    a1 = from_dict(A, {'name': 'a1'})
14:    a2 = from_dict(A, {'name': 'a2'})
15:    print('Test identity:', a1.items is a2.items)
File updated. Please review the changes and make sure they are correct (correct indentation, no duplicate lines, etc). Edit the file again if necessary.
(Open file: /dacite/reproduce.py)
(Current directory: /dacite)
bash-$
## [ai]
Now let's run the code to see if we see the same output as the issue.
```
python reproduce.py
```
## [user-observation]
Test identity: True
(Open file: /dacite/reproduce.py)
(Current directory: /dacite)
bash-$
## [ai]
We are indeed seeing the same output as the issue.
The issue suggests that the `default_factory` is called only once if a field is absent in the data.
To fix this issue, we need to ensure that the `default_factory` is called every time an instance is created, regardless of whether the field is present in the data or not.
Let's open the `dacite` module to see where we can make this change. First, we need to find the `dacite` module in the repository. It is likely to be in the `src` directory, but we should check to be sure.
```
ls -F
```
## [user-observation]
CHANGELOG.md
LICENSE
README.md
dacite/
dacite.egg-info/
pyproject.toml
reproduce.py
setup.py
tests/
(Open file: /dacite/reproduce.py)
(Current directory: /dacite)
bash-$
## [ai]
It looks like the `dacite` directory is present, which suggests that the `dacite` module is likely to be in that directory. Let's use find_file to see where the `dacite` module is located.
```
find_file "dacite.py" dacite
```
## [user-observation]
No matches found for "dacite.py" in /dacite/dacite
(Open file: /dacite/reproduce.py)
(Current directory: /dacite)
bash-$
## [ai]
It seems that there is no `dacite.py` file in the `dacite` directory. The module might be named differently or it could be in a subdirectory. Let's list the contents of the `dacite` directory to see if we can find any clues.
```
ls -F dacite
```
## [user-observation]
__init__.py
__pycache__/
cache.py
config.py
core.py
data.py
dataclasses.py
exceptions.py
frozen_dict.py
py.typed
types.py
(Open file: /dacite/reproduce.py)
(Current directory: /dacite)
bash-$
## [ai]
The `dacite` directory contains several files, but none of them are named `dacite.py`.
The module that handles the `from_dict` function is likely to be one of these files.
Since we don't know which one it is, we'll need to search for the `from_dict` function within these files to find the correct one.
Let's use the search_dir command to search for `from_dict` in the `dacite` directory.
```
search_dir "from_dict" dacite
```
## [user-observation]
Found 4 matches for "from_dict" in /dacite/dacite:
/dacite/dacite/__init__.py (2 matches)
/dacite/dacite/core.py (2 matches)
End of matches for "from_dict" in /dacite/dacite
(Open file: /dacite/reproduce.py)
(Current directory: /dacite)
bash-$
## [ai]
It looks like the `from_dict` function is defined in the `core.py` file. Let's open the `core.py` file to see where we can make the necessary changes to fix the issue.
```
open dacite/core.py
```
## [user-observation]
[File: /dacite/dacite/core.py (155 lines total)]
1:from dataclasses import is_dataclass
2:from itertools import zip_longest
3:from typing import TypeVar, Type, Optional, get_type_hints, Mapping, Any, Collection, MutableMapping
4:
5:from dacite.cache import cache
6:from dacite.config import Config
7:from dacite.data import Data
8:from dacite.dataclasses import (
9:    get_default_value_for_field,
10:    DefaultValueNotFoundError,
11:    get_fields,
12:    is_frozen,
13:)
14:from dacite.exceptions import (
15:    ForwardReferenceError,
16:    WrongTypeError,
17:    DaciteError,
18:    UnionMatchError,
19:    MissingValueError,
20:    DaciteFieldError,
21:    UnexpectedDataError,
22:    StrictUnionMatchError,
23:)
24:from dacite.types import (
25:    is_instance,
26:    is_generic_collection,
27:    is_union,
28:    extract_generic,
29:    is_optional,
30:    extract_origin_collection,
31:    is_init_var,
32:    extract_init_var,
33:    is_subclass,
34:)
35:
36:T = TypeVar("T")
37:
38:
39:def from_dict(data_class: Type[T], data: Data, config: Optional[Config] = None) -> T:
40:    """Create a data class instance from a dictionary.
41:
42:    :param data_class: a data class type
43:    :param data: a dictionary of a input data
44:    :param config: a configuration of the creation process
45:    :return: an instance of a data class
46:    """
47:    init_values: MutableMapping[str, Any] = {}
48:    post_init_values: MutableMapping[str, Any] = {}
49:    config = config or Config()
50:    try:
51:        data_class_hints = cache(get_type_hints)(data_class, localns=config.hashable_forward_references)
52:    except NameError as error:
53:        raise ForwardReferenceError(str(error))
54:    data_class_fields = cache(get_fields)(data_class)
55:    if config.strict:
56:        extra_fields = set(data.keys()) - {f.name for f in data_class_fields}
57:        if extra_fields:
58:            raise UnexpectedDataError(keys=extra_fields)
59:    for field in data_class_fields:
60:        field_type = data_class_hints[field.name]
61:        if field.name in data:
62:            try:
63:                field_data = data[field.name]
64:                value = _build_value(type_=field_type, data=field_data, config=config)
65:            except DaciteFieldError as error:
66:                error.update_path(field.name)
67:                raise
68:            if config.check_types and not is_instance(value, field_type):
69:                raise WrongTypeError(field_path=field.name, field_type=field_type, value=value)
70:        else:
71:            try:
72:                value = get_default_value_for_field(field, field_type)
73:            except DefaultValueNotFoundError:
74:                if not field.init:
75:                    continue
76:                raise MissingValueError(field.name)
77:        if field.init:
78:            init_values[field.name] = value
79:        elif not is_frozen(data_class):
80:            post_init_values[field.name] = value
81:    instance = data_class(**init_values)
82:    for key, value in post_init_values.items():
83:        setattr(instance, key, value)
84:    return instance
85:
86:
87:def _build_value(type_: Type, data: Any, config: Config) -> Any:
88:    if is_init_var(type_):
89:        type_ = extract_init_var(type_)
90:    if type_ in config.type_hooks:
91:        data = config.type_hooks[type_](data)
92:    if is_optional(type_) and data is None:
93:        return data
94:    if is_union(type_):
95:        data = _build_value_for_union(union=type_, data=data, config=config)
96:    elif is_generic_collection(type_):
97:        data = _build_value_for_collection(collection=type_, data=data, config=config)
98:    elif cache(is_dataclass)(type_) and isinstance(data, Mapping):
99:        data = from_dict(data_class=type_, data=data, config=config)
100:    for cast_type in config.cast:
(55 more lines below)
(Open file: /dacite/dacite/core.py)
(Current directory: /dacite)
bash-$
## [ai]
We are now looking at the `core.py` file which contains the `from_dict` function.
The issue suggests that the `default_factory` is called only once if a field is absent in the data.
To fix this issue, we need to ensure that the `default_factory` is called every time an instance is created, regardless of whether the field is present in the data or not.
The `from_dict` function has a loop that iterates over the fields of the data class.
For each field, it checks if the field is present in the data.
If the field is not present in the data, it tries to get the default value for the field.
This is where we need to make sure that the `default_factory` is called every time.
Let's scroll down to see the relevant part of the code where the default value is being fetched.
```
scroll_down
```
## [user-observation]
[File: /dacite/dacite/core.py (155 lines total)]
(55 more lines above)
56:        extra_fields = set(data.keys()) - {f.name for f in data_class_fields}
57:        if extra_fields:
58:            raise UnexpectedDataError(keys=extra_fields)
59:    for field in data_class_fields:
60:        field_type = data_class_hints[field.name]
61:        if field.name in data:
62:            try:
63:                field_data = data[field.name]
64:                value = _build_value(type_=field_type, data=field_data, config=config)
65:            except DaciteFieldError as error:
66:                error.update_path(field.name)
67:                raise
68:            if config.check_types and not is_instance(value, field_type):
69:                raise WrongTypeError(field_path=field.name, field_type=field_type, value=value)
70:        else:
71:            try:
72:                value = get_default_value_for_field(field, field_type)
73:            except DefaultValueNotFoundError:
74:                if not field.init:
75:                    continue
76:                raise MissingValueError(field.name)
77:        if field.init:
78:            init_values[field.name] = value
79:        elif not is_frozen(data_class):
80:            post_init_values[field.name] = value
81:    instance = data_class(**init_values)
82:    for key, value in post_init_values.items():
83:        setattr(instance, key, value)
84:    return instance
85:
86:
87:def _build_value(type_: Type, data: Any, config: Config) -> Any:
88:    if is_init_var(type_):
89:        type_ = extract_init_var(type_)
90:    if type_ in config.type_hooks:
91:        data = config.type_hooks[type_](data)
92:    if is_optional(type_) and data is None:
93:        return data
94:    if is_union(type_):
95:        data = _build_value_for_union(union=type_, data=data, config=config)
96:    elif is_generic_collection(type_):
97:        data = _build_value_for_collection(collection=type_, data=data, config=config)
98:    elif cache(is_dataclass)(type_) and isinstance(data, Mapping):
99:        data = from_dict(data_class=type_, data=data, config=config)
100:    for cast_type in config.cast:
101:        if is_subclass(type_, cast_type):
102:            if is_generic_collection(type_):
103:                data = extract_origin_collection(type_)(data)
104:            else:
105:                data = type_(data)
106:            break
107:    return data
108:
109:
110:def _build_value_for_union(union: Type, data: Any, config: Config) -> Any:
111:    types = extract_generic(union)
112:    if is_optional(union) and len(types) == 2:
113:        return _build_value(type_=types[0], data=data, config=config)
114:    union_matches = {}
115:    for inner_type in types:
116:        try:
117:            # noinspection PyBroadException
118:            try:
119:                value = _build_value(type_=inner_type, data=data, config=config)
120:            except Exception:  # pylint: disable=broad-except
121:                continue
122:            if is_instance(value, inner_type):
123:                if config.strict_unions_match:
124:                    union_matches[inner_type] = value
125:                else:
126:                    return value
127:        except DaciteError:
128:            pass
129:    if config.strict_unions_match:
130:        if len(union_matches) > 1:
131:            raise StrictUnionMatchError(union_matches)
132:        return union_matches.popitem()[1]
133:    if not config.check_types:
134:        return data
135:    raise UnionMatchError(field_type=union, value=data)
136:
