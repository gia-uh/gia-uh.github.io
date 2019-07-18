---
title: Index
---

![Octocat](/assets/escudo.jpg)

# Descripción

Este grupo de investigación cuenta con aproximadamente 10 investigadores, y el equipo está formado
tanto por investigadores senior, investigadores post-doctorales y pre-doctorales. Se trata de un grupo
dinámico y proactivo que organizan distintos seminarios internos, colaboran con diversas colaboraciones
con centros internacionales, como la Universidad Paris 1 Panthéon-Sorbonne (Francia), la de
Universidad de Alicante (España) o la Universidad de Montreal (Canadá) y tienen en la actualidad varios
proyectos de investigación relacionados con la temáticas de Inteligencia Artificial con tratamiento de
datos heterogéneos (temática por la que se solicita la estancia) en fase de ejecución.

# Objetivos

El objetivo del grupo de investigación es investigar en temas relacionados con la Inteligencia Artificial.
Dentro de esta área de investigación se profundiza en 4 áreas fundamentales: el procesamiento y
análisis inteligente del lenguaje natural, el aprendizaje de máquina y su aplicación, la soluciones basadas
en metaheurísticas a problemas complejos y la robótica. A partir de esto se han obtenido resultados en
explorar las cuestiones lingüísticas y computacionales involucrados en áreas tales como la generación
de lenguaje natural, el reconocimiento de la implicación textual, el discurso y el modelado del diálogo, la
pragmática y la multilingualidad; desarrollar herramientas computacionales para la inferencia de
conocimiento; la interacción entre la representación y la inferencia en la semántica computacional para el
lenguaje natural; el diseño de metaheurísticas para la solución de problemas de grandes dimensiones; el
diseño de flujos o ensembles óptimos de algoritmos de aprendizaje de máquina; o el diseño de
instrumentos robóticos.

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

{% endfor %}