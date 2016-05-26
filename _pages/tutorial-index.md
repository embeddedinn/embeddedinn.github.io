---
layout: single
type: pages
title: Tutorials
author_profile: true
permalink: /tutorials/
---

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a>
      {{ post.excerpt }}
    </li>
  {% endfor %}
</ul>
