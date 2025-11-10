---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 15
points: 750
correctAnswer: ["It allows you to define a method that is accessed like an attribute"]
options: [
  "It allows you to define a method that is accessed like an attribute",
  "It makes an attribute private",
  "It creates a static method",
  "It makes the attribute immutable"
]
---

What does the `@property` decorator do in a Python class?

```python
class Circle:
    def __init__(self, radius):
        self._radius = radius

    @property
    def diameter(self):
        return self._radius * 2

c = Circle(5)
print(c.diameter)  # Called like an attribute, not a method
```
