---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 15
points: 750
correctAnswer: ["10"]
options: [
  "10",
  "5",
  "calculate(5)",
  "ImportError"
]
---

Given this package structure, what is the output when you run `main.py`?

```python
# utils.py
def calculate(x):
    return x * 2

# main.py
from utils import calculate
result = calculate(5)
print(result)
```
