---
quizName: "Python Quiz"
type: "multiple-choice"
timeLimit: 30
points: 1250
correctAnswer: ["from .module_b import function_name"]
options: [
  "from .module_b import function_name",
  "from module_b import function_name",
  "from ..module_b import function_name",
  "import mypackage.module_b.function_name"
]
---

In a package structure, you want to import a function from a sibling module (at the same level).

If you're in `mypackage/module_a.py` and want to import from `mypackage/module_b.py`, what import statement should you use?
