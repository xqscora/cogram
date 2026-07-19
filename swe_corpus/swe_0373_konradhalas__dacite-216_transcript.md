# SWE trajectory 373
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
To start, we need to reproduce the issue described. The issue includes some example code for reproduction, which we can use. We'll create a new file called `reproduce_bug.py` and paste the example code into it.
```
create reproduce_bug.py
```
## [user-observation]
[File: /dacite/reproduce_bug.py (1 lines total)]
1:
(Open file: /dacite/reproduce_bug.py)
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
[File: /dacite/reproduce_bug.py (15 lines total)]
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
(Open file: /dacite/reproduce_bug.py)
(Current directory: /dacite)
bash-$
## [ai]
Now let's run the code to see if we can reproduce the issue.
```
python reproduce_bug.py
```
## [user-observation]
Test identity: True
(Open file: /dacite/reproduce_bug.py)
(Current directory: /dacite)
bash-$
## [ai]
We have successfully reproduced the issue.
The output `Test identity: True` indicates that the `items` field is being shared between instances, which is not the expected behavior.
The issue describes that the `default_factory` is being called only once, which is causing this problem.
To fix this, we need to ensure that the `default_factory` is called every time an instance is created.
This might involve modifying the `from_dict` function or the way the `dataclass` is being used.
First, let's locate the `from_dict` function in the codebase to understand how it works.
```
find_file "from_dict"
```
## [user-observation]
No matches found for "from_dict" in /dacite
(Open file: /dacite/reproduce_bug.py)
(Current directory: /dacite)
bash-$
## [ai]
Since we couldn't find the `from_dict` function directly, let's search for the term "from_dict" within the codebase to locate where it is defined or used.
```
search_dir "from_dict"
```
## [user-observation]
Found 236 matches for "from_dict" in /dacite:
/dacite/README.md (18 matches)
/dacite/dacite.egg-info/PKG-INFO (18 matches)
/dacite/dacite/__init__.py (2 matches)
/dacite/dacite/core.py (2 matches)
/dacite/reproduce_bug.py (3 matches)
/dacite/tests/core/test_base.py (31 matches)
/dacite/tests/core/test_collection.py (45 matches)
/dacite/tests/core/test_config.py (33 matches)
/dacite/tests/core/test_init_var.py (7 matches)
/dacite/tests/core/test_literal.py (9 matches)
/dacite/tests/core/test_optional.py (29 matches)
/dacite/tests/core/test_type.py (3 matches)
/dacite/tests/core/test_union.py (27 matches)
/dacite/tests/performance/test_from_dict.py (9 matches)
End of matches for "from_dict" in /dacite
(Open file: /dacite/reproduce_bug.py)
(Current directory: /dacite)
bash-$
## [ai]
The `from_dict` function is likely to be defined in the `dacite/core.py` file, as it seems to be the most relevant file for the `dacite` package. Let's open the `core.py` file and examine the `from_dict` function.
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
We have located the `from_dict` function in the `core.py` file. The function is responsible for creating a data class instance from a dictionary. The issue seems to be related to the way the `default_factory` is being handled.
To fix the issue, we need to ensure that the `default_factory` is called every time an instance is created. This might involve modifying the `from_dict` function to handle the `default_factory` correctly.
Let's examine the `from_dict` function more closely to understand how it works and where the `default_factory` is being called.
It seems that the `get_default_value_for_field` function is being used to get the default value for a field.
We should examine this function to see if it is calling the `default_factory` correctly.
```
search_file "get_default_value_for_field"
```
## [user-observation]
Found 2 matches for "get_default_value_for_field" in /dacite/dacite/core.py:
Line 9:    get_default_value_for_field,
Line 72:                value = get_default_value_for_field(field, field_type)
End of matches for "get_default_value_for_field" in /dacite/dacite/core.py
(Open file: /dacite/dacite/core.py)
(Current directory: /dacite)
bash-$
## [ai]
The `get_default_value_for_field` function is being imported from the `dacite.dataclasses` module. Let's open the `dataclasses.py` file in the `dacite` directory to examine the function.
```
open dacite/dataclasses.py
```
## [user-observation]
[File: /dacite/dacite/dataclasses.py (33 lines total)]
1:from dataclasses import Field, MISSING, _FIELDS, _FIELD, _FIELD_INITVAR  # type: ignore
2:from typing import Type, Any, TypeVar, List
3:
4:from dacite.cache import cache
5:from dacite.types import is_optional
6:
7:T = TypeVar("T", bound=Any)
8:
9:
10:class DefaultValueNotFoundError(Exception):
11:    pass
12:
13:
14:@cache
15:def get_default_value_for_field(field: Field, type_: Type) -> Any:
16:    if field.default != MISSING:
17:        return field.default
18:    elif field.default_factory != MISSING:  # type: ignore
19:        return field.default_factory()  # type: ignore
20:    elif is_optional(type_):
21:        return None
22:    raise DefaultValueNotFoundError()
23:
24:
25:@cache
26:def get_fields(data_class: Type[T]) -> List[Field]:
27:    fields = getattr(data_class, _FIELDS)
28:    return [f for f in fields.values() if f._field_type is _FIELD or f._field_type is _FIELD_INITVAR]
29:
30:
31:@cache
32:def is_frozen(data_class: Type[T]) -> bool:
33:    return data_class.__dataclass_params__.frozen
(Open file: /dacite/dacite/dataclasses.py)
(Current directory: /dacite)
bash-$
## [ai]
We have located the `get_default_value_for_field` function in the `dataclasses.py` file.
The function is responsible for getting the default value for a field.
It checks if the field has a `default` value, and if not, it checks if it has a `default_factory`.
If a `default_factory` is present, it calls the `default_factory` function to get the default value.
The issue describes that the `default_factory` is being called only once, which indicates that the caching of `get_default_value_for_field` might be the cause of the problem.
Since the function is cached, it is not being called every time an instance is created, which is why the `default_factory` is only being called once.
To fix this, we need to ensure that the `get_default_value_for_field` function is called every time an instance is created. We can do this by removing the `cache` decorator from the function.
Let's remove the `cache` decorator from the `get_default_value_for_field` function.
```
edit 14:15
def get_default_value_for_field(field: Field, type_: Type) -> Any:
end_of_edit
```
## [user-observation]
[File: /dacite/dacite/dataclasses.py (32 lines total)]
1:from dataclasses import Field, MISSING, _FIELDS, _FIELD, _FIELD_INITVAR  # type: ignore
2:from typing import Type, Any, TypeVar, List
3:
4:from dacite.cache import cache
5:from dacite.types import is_optional
6:
7:T = TypeVar("T", bound=Any)
8:
9:
10:class DefaultValueNotFoundError(Exception):
11:    pass
12:
13:
14:def get_default_value_for_field(field: Field, type_: Type) -> Any:
15:    if field.default != MISSING:
16:        return field.default
17:    elif field.default_factory != MISSING:  # type: ignore
18:        return field.default_factory()  # type: ignore
19:    elif is_optional(type_):
20:        return None
21:    raise DefaultValueNotFoundError()
22:
23:
24:@cache
25:def get_fields(data_class: Type[T]) -> List[Field]:
26:    fields = getattr(data_class, _FIELDS)
27:    return [f for f in fields.values() if f._field_type is _FIELD or f._field_type is _FIELD_INITVAR]
28:
29:
30:@cache
31:def is_frozen(data_class: Type[T]) -> bool:
32:    return data_class.__dataclass_params__.frozen
File updated. Please review the changes and make sure they are correct (correct indentation, no duplicate lines, etc). Edit the file again if necessary.
(Open file: /dacite/dacite/dataclasses.py)
(Current directory: /dacite)
bash-$
## [ai]
The `cache` decorator has been removed from the `get_default_value_for_field` function. Now, the function should be called every time an instance is created, which should fix the issue.
Before submitting the changes, it would be prudent to run the reproduce_bug.py code again to ensure that the changes have the desired effect.
```
python reproduce_bug.py
```
## [user-observation]
Test identity: False
(Open file: /dacite/dacite/dataclasses.py)
(Current directory: /dacite)
bash-$
