---
title: Miembros
permalink: /es/members
layout: es_default
---

# 👪 Miembros

## Investigadores Principales

{% for person in site.data.people.researchers %}

- **{{ person.name }}**

    {%if person.email %}[ ![Email](https://img.shields.io/badge/Contactar-por_email-yellowgreen?logo=gmail) ](mailto://{{ person.email }}){% endif %}
    {%if person.github %}[ ![GitHub followers](https://img.shields.io/github/followers/{{ person.github }}?label=Seguir%20en%20Github&logo=github&style=flat) ](https://github.com/{{ person.github }}){% endif %}
    {%if person.twitter %}[ ![Twitter Follow](https://img.shields.io/twitter/follow/{{ person.twitter }}?color=blue&label=Seguir%20en%20Twitter&logo=Twitter&style=flat) ](https://twitter.com/{{ person.twitter }}){% endif %}
    {%if person.linkedin %}[ ![Follow in LinkedIn](https://img.shields.io/badge/Seguir%20en-LinkedIn-red?logo=linkedin) ](https://linkedin.com/in/{{ person.linkedin }}){% endif %}

    > {{ person.bio.es }}

{% endfor %}

## Estudiantes de Doctorado

{% for person in site.data.people.phds %}

- **{{ person.name }}**

    {%if person.email %}[ ![Email](https://img.shields.io/badge/Contactar-por_email-yellowgreen?logo=gmail) ](mailto://{{ person.email }}){% endif %}
    {%if person.github %}[ ![GitHub followers](https://img.shields.io/github/followers/{{ person.github }}?label=Seguir%20en%20Github&logo=github&style=flat) ](https://github.com/{{ person.github }}){% endif %}
    {%if person.twitter %}[ ![Twitter Follow](https://img.shields.io/twitter/follow/{{ person.twitter }}?color=blue&label=Seguir%20en%20Twitter&logo=Twitter&style=flat) ](https://twitter.com/{{ person.twitter }}){% endif %}
    {%if person.linkedin %}[ ![Follow in LinkedIn](https://img.shields.io/badge/Seguir%20en-LinkedIn-red?logo=linkedin) ](https://linkedin.com/in/{{ person.linkedin }}){% endif %}

    > {{ person.bio.es }}

{% endfor %}

## Estudiantes de Máster

{% for person in site.data.people.masters %}

- **{{ person.name }}**

    {%if person.email %}[ ![Email](https://img.shields.io/badge/Contactar-por_email-yellowgreen?logo=gmail) ](mailto://{{ person.email }}){% endif %}
    {%if person.github %}[ ![GitHub followers](https://img.shields.io/github/followers/{{ person.github }}?label=Seguir%20en%20Github&logo=github&style=flat) ](https://github.com/{{ person.github }}){% endif %}
    {%if person.twitter %}[ ![Twitter Follow](https://img.shields.io/twitter/follow/{{ person.twitter }}?color=blue&label=Seguir%20en%20Twitter&logo=Twitter&style=flat) ](https://twitter.com/{{ person.twitter }}){% endif %}
    {%if person.linkedin %}[ ![Follow in LinkedIn](https://img.shields.io/badge/Seguir%20en-LinkedIn-red?logo=linkedin) ](https://linkedin.com/in/{{ person.linkedin }}){% endif %}

    > {{ person.bio.es }}

{% endfor %}
