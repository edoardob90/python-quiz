---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 20
points: 1000
correctAnswer: ["pathlib provides object-oriented interface, os.path uses string operations"]
options: [
  "pathlib provides object-oriented interface, os.path uses string operations",
  "os.path is faster than pathlib",
  "pathlib only works on Unix, os.path works everywhere",
  "They are identical, just different names"
]
---

What is the main difference between `pathlib.Path` and `os.path`?

```python
from pathlib import Path
import os.path

# Path object approach
p = Path("folder") / "file.txt"

# os.path approach
p = os.path.join("folder", "file.txt")
```
