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
      <a href="{{site.baseurl}}{{ post.url }}">{{ post.title }}<p/></a>
      {{ post.excerpt }}
    </li>
  {% endfor %}
</ul>
