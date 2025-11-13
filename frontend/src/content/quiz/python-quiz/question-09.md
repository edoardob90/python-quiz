---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 25
points: 1250
correctAnswer: ["30, 20, 10"]
options: ["30, 20, 10", "30, 30, 30", "10, 10, 10", "30, 10, 10"]
---

What will be printed by this code?

```python
x = 10

def outer():
    x = 20
    def inner():
        x = 30
        print(x)
    inner()
    print(x)

outer()

print(x)
```
