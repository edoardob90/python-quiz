# Python Intro Tutorial Quiz

This quiz covers the content from notebooks 01-06 (Basic Datatypes through Modules and Packages). The questions are arranged in order of increasing difficulty.

---

## Question 1: Immutable Data Types (Easy)

**From:** Notebook 01 - Basic Datatypes
**Type:** Multiple Choice

Which of the following data types is immutable in Python?

A) List
B) Dictionary
C) Set
D) Tuple

---

## Question 2: String Slicing (Easy)

**From:** Notebook 01 - Basic Datatypes
**Type:** Short Answer

What is the output of the following code?

```python
name = "Python"
print(name[1:4])
```

**Your answer:** _______________

---

## Question 3: Loop Control Flow (Medium)

**From:** Notebook 02 - Control Flow
**Type:** Multiple Choice

What does the `else` clause do when used with a `for` loop?

A) It executes if the loop encounters an error
B) It executes only if the loop completes without hitting a `break` statement
C) It executes after every iteration
D) It executes only if the loop condition is False from the start

---

## Question 4: Exception Handling Blocks (Medium)

**From:** Notebook 02 - Control Flow
**Type:** Short Answer

Fill in the blank: In a `try-except-else-finally` block, the **__________** block always executes regardless of whether an exception occurred.

**Your answer:** _______________

---

## Question 5: Function Arguments (Medium)

**From:** Notebook 03 - Functions
**Type:** Multiple Choice

Given the function definition `def greet(name, greeting="Hello")`, which of the following function calls is INVALID?

A) `greet("Alice")`
B) `greet(name="Bob")`
C) `greet(greeting="Hi", name="Charlie")`
D) `greet("David", name="Eve")`

---

## Question 6: Context Managers (Medium-Hard)

**From:** Notebook 04 - Input/Output
**Type:** Short Answer

What is the main advantage of using `with open(filename) as f:` instead of just `f = open(filename)`?

**Your answer:** _______________

---

## Question 7: Variable Arguments (Medium-Hard)

**From:** Notebook 03 - Functions
**Type:** Multiple Choice

What will be the output of this code?

```python
def combine(*args, **kwargs):
    return len(args) + len(kwargs)

result = combine(1, 2, 3, name="Alice", age=30)
print(result)
```

A) 2
B) 3
C) 5
D) Error

---

## Question 8: Special Methods (Hard)

**From:** Notebook 05 - Object-Oriented Programming
**Type:** Short Answer

What special method (dunder method) should you implement in a class to make instances of that class comparable using the `<` operator?

**Your answer:** _______________

---

## Question 9: Variable Scope (Hard)

**From:** Notebook 03 - Functions
**Type:** Multiple Choice

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

A) 30, 20, 10
B) 30, 30, 30
C) 10, 10, 10
D) 30, 10, 10

---

## Question 10: Package Imports (Hard)

**From:** Notebook 06 - Modules and Packages
**Type:** Short Answer

In a package structure, you want to import a function from a sibling module (at the same level). If you're in `mypackage/module_a.py` and want to import from `mypackage/module_b.py`, what import statement should you use?

**Your answer:** _______________

---

<details>
<summary><strong>Click here to view answers</strong></summary>

## Answer Key

### Question 1
**Answer:** D) Tuple

**Explanation:** Tuples are immutable in Python, meaning their contents cannot be changed after creation. Lists, dictionaries, and sets are all mutable.

---

### Question 2
**Answer:** `yth`

**Explanation:** String slicing `name[1:4]` returns characters at indices 1, 2, and 3 (the end index is exclusive). For "Python", this gives characters 'y', 't', 'h'.

---

### Question 3
**Answer:** B) It executes only if the loop completes without hitting a `break` statement

**Explanation:** The `else` clause of a loop is a unique Python feature that executes only when the loop completes normally (without encountering a `break`).

---

### Question 4
**Answer:** `finally`

**Explanation:** The `finally` block always executes, whether an exception was raised or not. This makes it useful for cleanup operations like closing files or releasing resources.

---

### Question 5
**Answer:** D) `greet("David", name="Eve")`

**Explanation:** This call is invalid because "David" is passed as a positional argument for the first parameter (`name`), but then `name="Eve"` tries to pass a keyword argument for the same parameter. You cannot provide the same parameter twice.

---

### Question 6
**Answer:** The `with` statement automatically closes the file even if an exception occurs, preventing resource leaks.

**Explanation:** Context managers (the `with` statement) ensure proper resource management by guaranteeing cleanup code runs, even if errors occur. This prevents file handles from remaining open and consuming system resources.

---

### Question 7
**Answer:** C) 5

**Explanation:** The function receives 3 positional arguments (1, 2, 3) captured by `*args` and 2 keyword arguments (name="Alice", age=30) captured by `**kwargs`. The total is 3 + 2 = 5.

---

### Question 8
**Answer:** `__lt__` (or `__lt__(self, other)`)

**Explanation:** The `__lt__` (less than) special method is called when using the `<` operator. Similarly, `__gt__` for `>`, `__le__` for `<=`, `__ge__` for `>=`, and `__eq__` for `==`.

---

### Question 9
**Answer:** A) 30, 20, 10

**Explanation:** Each function has its own local scope. The `inner()` function prints its local `x` (30), then `outer()` prints its local `x` (20), and finally the global `x` (10) is printed. Each assignment creates a new local variable in that function's scope.

---

### Question 10
**Answer:** `from .module_b import function_name`

**Explanation:** The single dot (`.`) represents a relative import from the current package. This is the recommended way to import from sibling modules within the same package. The dot notation makes the import relative to the package structure rather than absolute.

</details>
