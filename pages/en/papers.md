---
title: Publications
permalink: /en/papers
---

# 📃 Publications

{% for paper in site.data.papers.docs %}

- **{{ paper.title }}**. 
{% for author in paper.authors %} {{ author }}, {% endfor %}
_{{ paper.journal }}_, {{ paper.year }}.

{% endfor %}
