---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 20
points: 1000
correctAnswer: ["{'a': 1, 'b': 2, 'c': 3}"]
options: [
  "{'a': 1, 'b': 2, 'c': 3}",
  "{'a': 1, 'c': 3}",
  "{'b': 2, 'c': 3}",
  "SyntaxError"
]
---

What is the output of this code?

```python
def merge(**kwargs):
    return kwargs

data = {'a': 1, 'b': 2}
result = merge(**data, c=3)
print(result)
```
