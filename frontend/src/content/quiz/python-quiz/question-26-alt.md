---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 15
points: 750
correctAnswer: ["report.pdf"]
options: [
  "report.pdf",
  "/home/user/documents/report.pdf",
  "documents/report.pdf",
  "report"
]
---

What is the output of this code?

```python
from pathlib import Path

file_path = Path('/home/user/documents/report.pdf')
print(file_path.name)
```
