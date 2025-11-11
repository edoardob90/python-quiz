---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 30
points: 1250
correctAnswer: ["Only public_function is imported"]
options: [
  "Only public_function is imported",
  "Both public_function and private_function are imported",
  "All functions in utils.py are imported",
  "ImportError occurs"
]
---

Given this package structure, what happens when you run `from mypackage.utils import *`?

```python
# mypackage/utils.py
__all__ = ['public_function']

def public_function():
    return "public"

def private_function():
    return "private"
```
