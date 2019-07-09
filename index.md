---
title: Index
---

# Descripción

blablabla

# Proyectos


{% for item in site.data.listproyect.docs %}
### {{ item.title }} [more]({{item.link}})

	{{item.abstract}}

[source]( {{item.linkdesc}} )

{% endfor %}

[Link to a page](./about.html)

### Working with lib

{% for item in site.data.listuser.docs %}
* | {{item.name}} | {{item.year}} | {{item.email}} | {{item.picture}} |
{% endfor %}