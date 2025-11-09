---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 30
points: 1250
correctAnswer: ["20"]
options: ["20", "10", "AttributeError", "None"]
---

What is the output of this code?

```python
class Temperature:
    def __init__(self):
        self._celsius = 0

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("Temperature below absolute zero!")
        self._celsius = value

    @property
    def fahrenheit(self):
        return self._celsius * 9/5 + 32

temp = Temperature()
temp.celsius = 20
print(temp.celsius)
```
