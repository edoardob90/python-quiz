---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 20
points: 1000
correctAnswer: ["generator object"]
options: [
  "generator object",
  "[1, 2, 3]",
  "(1, 2, 3)",
  "1"
]
---

What type of object does this function return when called?

```python
def count_up():
    for i in [1, 2, 3]:
        yield i

result = count_up()
print(type(result).__name__)
```
