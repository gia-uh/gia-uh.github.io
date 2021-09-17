---
title: Publicaciones
permalink: /es/papers
layout: es_default
---

# 📃 Publicaciones

{% for paper in site.data.papers.docs %}

- [**{{ paper.title }}**]({{ paper.link }}).
{% for author in paper.authors %} {{ author }}, {% endfor %}
_{{ paper.journal }}_, {{ paper.year }}.

{% endfor %}

# 🗨️ Presentaciones

{% for paper in site.data.papers.presentations %}

- [**{{ paper.title }}**]({{ paper.link }}).
{% for author in paper.authors %} {{ author }}, {% endfor %}
_{{ paper.event }}_, {{ paper.place }}. {{ paper.year }}.

{% endfor %}
