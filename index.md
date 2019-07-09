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

# Investigaciones

{% for item in site.data.listinvest.docs %}
### {{ item.title }} [more]({{item.link}})

	{{item.abstract}}

*{{item.autor}}*

[source]( {{item.linkdesc}} )

[journal]( {{item.journal}} )
{% endfor %}

# Miembros

{% for item in site.data.listuser.docs %}
{{item.name}}
{{item.year}}
{{item.email}}
![Octocat](/assets/carabana.jpg)
{% endfor %}