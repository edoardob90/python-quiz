---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 15
points: 250
correctAnswer: ["2, 5"]
options: ["2, 5", "5, 5", "2, 2", "0, 0"]
---

What is the output of this code?

```python
class Counter:
    count = 0

    def __init__(self):
        self.instance_count = 0

c1 = Counter()
c2 = Counter()

c1.instance_count = 2
c2.instance_count = 5

print(f"{c1.instance_count}, {c2.instance_count}")
```
