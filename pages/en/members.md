---
title: Members
permalink: /en/members
---

# 👪 Members

## Principal Researchers

{% for person in site.data.people.researchers %}

- **{{ person.name }}**
    {%if person.email %}[ ![Email](https://img.shields.io/badge/Contact-by_email-yellowgreen?logo=gmail) ](mailto://{{ person.email }}){% endif %}
    {%if person.github %}[ ![GitHub followers](https://img.shields.io/github/followers/{{ person.github }}?label=Follow%20on%20Github&logo=github&style=flat) ](https://github.com/{{ person.github }}){% endif %}
    {%if person.twitter %}[ ![Twitter Follow](https://img.shields.io/twitter/follow/AlejandroPiad?color=blue&label=Follow%20on%20Twitter&logo=Twitter&style=flat) ](https://twitter.com/{{ person.twitter }}){% endif %}
    {%if person.linkedin %}[ ![Follow in LinkedIn](https://img.shields.io/badge/Follow%20on-LinkedIn-red?logo=linkedin) ](https://linkedin.com/in/{{ person.linkedin }}){% endif %}

    > {{ person.bio.en }}

{% endfor %}
