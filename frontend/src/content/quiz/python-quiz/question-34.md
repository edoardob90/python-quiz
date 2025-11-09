---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 30
points: 1250
correctAnswer: ["Only func1 is imported"]
options: [
  "Only func1 is imported",
  "Both func1 and func2 are imported",
  "All functions in utils.py are imported",
  "ImportError occurs"
]
---

Given this package structure, what happens when you run `from mypackage.utils import *`?

```python
# mypackage/utils.py
__all__ = ['func1']

def func1():
    return "public"

def func2():
    return "not in __all__"
```
