---
title: Home
---


# IA group

asdasd
asdasdhkasd

asdasdjasd
a
sdhasdasd

	asdasdasdasd


```python
	def F(x):
		return 1 if x == 0 or x == 1 else F(x - 1) + F(x - 2)
```

### Add Link

[Link to a page](./about.html)

### Working with lib

{% for item in site.data.listuser.docs %}
* | {{item.name}} | {{item.year}} | {{item.email}} | {{item.picture}} |
{% endfor %}