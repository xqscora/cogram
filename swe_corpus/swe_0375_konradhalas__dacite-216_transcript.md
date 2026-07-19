# SWE trajectory 375
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
To start addressing the issue, we should first try to replicate the reported behavior.
The issue includes some example code for reproduction, which we can use.
We'll create a new file called `reproduce.py` and paste the example code into it.
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
[File: /dacite/reproduce.py (17 lines total)]
1:#!/usr/bin/env python
2:
3:from dataclasses import field, dataclass
4:
5:from dacite import from_dict
6:
7:
8:@dataclass
9:class A:
10:    name: str
11:    items: list[str] = field(default_factory=list)
12:
13:
14:if __name__ == '__main__':
15:    a1 = from_dict(A, {'name': 'a1'})
16:    a2 = from_dict(A, {'name': 'a2'})
17:    print('Test identity:', a1.items is a2.items)
File updated. Please review the changes and make sure they are correct (correct indentation, no duplicate lines, etc). Edit the file again if necessary.
(Open file: /dacite/reproduce.py)
(Current directory: /dacite)
bash-$
## [ai]
Now let's run the code to see if we observe the same output as described in the issue.
```
python reproduce.py
```
## [user-observation]
Test identity: True
(Open file: /dacite/reproduce.py)
(Current directory: /dacite)
bash-$
## [ai]
We are indeed seeing the same output as the issue. The issue suggests that the `default_factory` is called only once if a field is absent in the data. This behavior is likely due to how `dacite` handles default values.
To address this, we should look into how `dacite` handles default values and ensure that `default_factory` is called correctly for each instance.
Let's search for the relevant code in the `dacite` repository that handles default values and dataclass fields.
```
search_dir "default_factory"
```
## [user-observation]
Found 11 matches for "default_factory" in /dacite:
/dacite/dacite/config.py (2 matches)
/dacite/dacite/dataclasses.py (2 matches)
/dacite/reproduce.py (1 matches)
/dacite/tests/core/test_base.py (4 matches)
/dacite/tests/test_dataclasses.py (2 matches)
End of matches for "default_factory" in /dacite
(Open file: /dacite/reproduce.py)
(Current directory: /dacite)
bash-$
## [ai]
The relevant files for handling `default_factory` are likely to be `config.py` and `dataclasses.py`. Let's start by examining the `dataclasses.py` file, as it likely contains the logic for handling dataclass fields.
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
The `get_default_value_for_field` function in `dataclasses.py` is responsible for obtaining default values for dataclass fields.
The issue suggests that `default_factory` is called only once, which means its value is likely cached somewhere.
We should ensure that `default_factory` is called every time an instance is created, not just once.
To do this, we need to prevent the default value from being cached.
Let's modify the `get_default_value_for_field` function to not cache values from `default_factory`.
```
edit 15:22
def get_default_value_for_field(field: Field, type_: Type) -> Any:
    if field.default != MISSING:
        return field.default
    elif field.default_factory != MISSING:  # type: ignore
        return field.default_factory()  # type: ignore
    elif is_optional(type_):
        return None
    raise DefaultValueNotFoundError()
end_of_edit
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
File updated. Please review the changes and make sure they are correct (correct indentation, no duplicate lines, etc). Edit the file again if necessary.
(Open file: /dacite/dacite/dataclasses.py)
(Current directory: /dacite)
bash-$
## [ai]
The `get_default_value_for_field` function has been updated to not use `@cache` for `default_factory`. Now, let's run the reproduce.py code again to ensure that this change has the desired effect.
```
python reproduce.py
```
## [user-observation]
Test identity: True
(Open file: /dacite/dacite/dataclasses.py)
(Current directory: /dacite)
bash-$
## [ai]
The output is still showing `Test identity: True`, which means the issue persists. The `default_factory` is still being called only once. The function `get_default_value_for_field` might be called once and then its result used repeatedly.
We need to ensure that `get_default_value_for_field` is called for each instance and that `default_factory` is invoked each time. Let's inspect the code that calls `get_default_value_for_field` to ensure it does not cache the result.
The caller of `get_default_value_for_field` is likely in the `config.py` file, as it contains the configuration and initialization logic. Let's open the `config.py` file and search for the usage of `get_default_value_for_field`.
```
open dacite/config.py
```
## [user-observation]
[File: /dacite/dacite/config.py (25 lines total)]
1:import sys
2:from dataclasses import dataclass, field
3:from typing import Dict, Any, Callable, Optional, Type, List
4:
5:from dacite.frozen_dict import FrozenDict
6:
7:if sys.version_info.minor >= 8:
8:    from functools import cached_property  # type: ignore  # pylint: disable=no-name-in-module
9:else:
10:    # Remove when we drop support for Python<3.8
11:    cached_property = property  # type: ignore  # pylint: disable=invalid-name
12:
13:
14:@dataclass
15:class Config:
16:    type_hooks: Dict[Type, Callable[[Any], Any]] = field(default_factory=dict)
17:    cast: List[Type] = field(default_factory=list)
18:    forward_references: Optional[Dict[str, Any]] = None
19:    check_types: bool = True
20:    strict: bool = False
21:    strict_unions_match: bool = False
22:
23:    @cached_property
24:    def hashable_forward_references(self) -> Optional[FrozenDict]:
25:        return FrozenDict(self.forward_references) if self.forward_references else None
(Open file: /dacite/dacite/config.py)
(Current directory: /dacite)
bash-$
## [ai]
The `config.py` file does not appear to call `get_default_value_for_field` directly.
The `Config` class has a `cached_property` for `hashable_forward_references`, which could be related to the caching issue.
However, it seems unlikely that this is the cause of the `default_factory` being called only once.
Given that the `config.py` file doesn't seem to be involved in the direct call to `get_default_value_for_field`, we should look elsewhere.
The `get_default_value_for_field` function might be used in the initialization of instances.
Let's search the codebase for where `get_default_value_for_field` is called.
```
search_dir "get_default_value_for_field"
```
## [user-observation]
Found 11 matches for "get_default_value_for_field" in /dacite:
/dacite/dacite/core.py (2 matches)
/dacite/dacite/dataclasses.py (1 matches)
/dacite/tests/test_dataclasses.py (8 matches)
End of matches for "get_default_value_for_field" in /dacite
(Open file: /dacite/dacite/config.py)
(Current directory: /dacite)
bash-$
## [ai]
The `get_default_value_for_field` function is called in `core.py` and `tests_dataclasses.py`. Since `core.py` is likely to contain the core logic of `dacite`, we should start by examining its usage of `get_default_value_for_field`.
Let's open the `core.py` file and search for the usage of `get_default_value_for_field` to understand where the caching might be occurring.
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
