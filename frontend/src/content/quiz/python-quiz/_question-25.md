---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 20
points: 750
correctAnswer: ["readline() returns one line, readlines() returns a list of all lines"]
options: [
  "readline() returns one line, readlines() returns a list of all lines",
  "readline() returns a list, readlines() returns a string",
  "They are exactly the same",
  "readline() reads the whole file, readlines() reads one line"
]
---

What is the difference between `readline()` and `readlines()` methods?

```python
with open("file.txt") as f:
    # Which method to use?
    content = f.readline()   # vs
    content = f.readlines()
```
