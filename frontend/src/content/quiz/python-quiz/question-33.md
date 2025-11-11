---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 15
points: 500
correctAnswer: ["Public functions and classes that are intended for external use"]
options: [
  "Public functions and classes that are intended for external use",
  "All functions defined in the package",
  "Only the __init__.py file contents",
  "The package documentation"
]
---

In the context of Python packages, what does a package's **API** (Application Programming Interface) refer to?

```python
# In mypackage/__init__.py
from .module_a import public_function
from .module_b import PublicClass

# These become the package's API
```
