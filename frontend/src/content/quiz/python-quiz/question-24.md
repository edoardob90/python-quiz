---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 10
points: 500
correctAnswer: ["'a'"]
options: ["'a'", "'w'", "'r'", "'r+'"]
---

Which file mode should you use to **append** content to the end of an existing file without deleting its current content?

```python
with open("log.txt", mode="...") as f:
    f.write("New log entry")
```
