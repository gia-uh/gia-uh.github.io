---
title: Publicaciones
permalink: /es/papers
layout: es_default
---

# 📃 Publicaciones


{% for paper in site.data.papers.docs %}

- **{{ paper.title }}**. 
{% for author in paper.authors %} {{ author }}, {% endfor %}
_{{ paper.journal }}_

{% endfor %}
