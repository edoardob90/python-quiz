---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 30
points: 1000
correctAnswer: ["5"]
options: ["2", "3", "5", "Error"]
---

What will be the output of this code?

```python
def combine(*args, **kwargs):
    return len(args) + len(kwargs)

result = combine(1, 2, 3, name="Alice", age=30)
print(result)
```
