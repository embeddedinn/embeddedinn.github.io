---
title: Home made single sided PCBs
date: 2013-02-06 14:46:38.000000000 +05:30
published: true
categories: 
 - Articles
 - Tutorial
tags: 
 - PCB 
 - Electronics

excerpt: "an old school home made PCB fabrication technique tutorial"
---
<style>
div {
    text-align: justify;
    text-justify: inter-word;
}
</style>

{% include base_path %}

This article has been migrated from my [original post](https://embeddedinn.wordpress.com/tutorials/home-made-sigle-sided-pcbs/){:target="_blank"}  at [embeddedinn.wordpress.com](http://embeddedinn.wordpress.com){:target="_blank"}.   
{: .notice--info}

There are numerous tutorials available in the internet about home made PCBs and the toner transfer method. Here is my addition to that :smile: )

<b><u>Step 1</u></b>: Design your PCB in your favorite tool. I personally prefer CadSoft EagleCAD.

This is true only at the time of writing the article :smile: . My current preferred tools is KiCAD.   
{: .notice--warning} 

<b><u>Step 2</u></b>: Print the <u><i>mirrored</i></u> PCB artwork in a high GSM high gloss paper with a laser printer . I use the card like ones available to print posters.

<b><u>Step 3</u></b>: Cut out your copper-clad PCB to the required size. Clean the copper side and remove the natural oxide coating. I use mild steel wool used to clean utensils. But, be extra cautious not to make the copper surface uneven or scratched. While cleaning, it is better to move the steel wool in the same direction always.

{% include image.html
        img="/images/posts/PCB/00.jpg" 
	width="300"
%}

<b><u>Step 4</u></b>: Keep the printed artwork face down into the copper side of the copper-clad. Ensure that the edges of the paper and copper-clad are aligned.

Now place a clothes iron box at maximum temperature over the paper and apply pressure for around 20 seconds. Now move around the iron box applying pressure. Pa special attention to the edges.

At the end of this process you will be able to see a shadow of the traces over the paper as shown in the figure below.

{% include image.html
        img="/images/posts/PCB/01.jpg" 
	width="226"
%}

<b><u>Step 5</u></b>: Keep the board aside to cool down. Once the board is cooled down, immerse the board into water  (at room temperature) for around 20 minutes. This will make the paper soft.

{% include image.html
        img="/images/posts/PCB/02.jpg" 
	width="384"
%}

<b><u>Step 6</u></b>: Now use a soft bristle toothbrush to gently remove the white part of the paper. Once you start seeing the copper side, be extra careful so that you don’t accidentally remove the traces (seen in black). Do not try to peel off the paper.

{% include image.html
        img="/images/posts/PCB/03.jpg" 
	width="384"
%}
<br/>
{% include image.html
        img="/images/posts/PCB/04.jpg" 
%}

<br/>
<b><u>Step 7</u></b>: If in case you damage any of the traces, use a fine tip marker (the ones used with OHP sheets or to label CDs) to make up for the damage.

{% include image.html
        img="/images/posts/PCB/05.jpg" 
	width="336"
%}

<br/>
<b><u>Step 8</u></b>: Prepare a concentrated solution of ferric chloride in water. It is better to use a plastic or glass container for this since the solution is highly reactive. The reaction is also exothermic . So, take necessary precautions.

Make sure that all particles are dissolved and the solution is clean since floating particles can damage your board.

{% include image.html
        img="/images/posts/PCB/06.jpg" 
	width="269"
%}

<br/>
<b><u>Step 9</u></b>: Place the board gently into the solution. Stir the solution once every 30 seconds. Depending on the quality of your solution, the base material of the board will be visible in around 15 minutes. The solution will also turn green.

{% include image.html
        img="/images/posts/PCB/07.jpg" 
	width="384"
%}
<br/>
{% include image.html
        img="/images/posts/PCB/08.jpg" 
	width="288"
%}
<br/>
<b><u>Step 10</u></b>: Once you ensure that all visible copper is removed, remove the board from the solution and clean it under running water and dry the board with a tissue paper.

{% include image.html
        img="/images/posts/PCB/09.jpg" 
%}
<br/>
{% include image.html
        img="/images/posts/PCB/10.jpg" 
	width="288"
%}
<br/>
{% include image.html
        img="/images/posts/PCB/11.jpg" 
	width="288"
%}
<br/>
<b><u>Step 11</u></b>: Remove the toner with turpentine or nail polish remover and drill holes or appropriate size.
