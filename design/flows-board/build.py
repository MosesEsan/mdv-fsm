"""Assemble one self-contained flows board: python3 build.py <client.js> <out.html> "<Board title>" "<one-line>" """
import sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
client, out, title, line = sys.argv[1:5]
css = open(HERE+'/engine.css').read() + open(HERE+'/engine-extra.css').read()
pre = open(HERE+'/engine-pre.js').read()
post = open(HERE+'/engine-post.js').read()
body = open(client).read()
html = f'''<meta charset="utf-8">
<title>{title}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>{css}</style>
<header class="fb-head" id="fbHead">
  <div class="fb-head-in">
    <div class="fb-brand"><h1>{title}</h1><p>{line}</p></div>
    <div class="fb-ctrls" role="group" aria-label="Board controls">
      <div class="fb-seg"><span class="fb-seg-l" id="lView">View</span>
        <div class="fb-seg-b accent" role="group" aria-labelledby="lView"><button type="button" data-board="view" data-v="flows">Flows</button><button type="button" data-board="view" data-v="guide">Design guide</button></div></div>
      <div class="fb-seg"><span class="fb-seg-l" id="lTheme">Theme</span>
        <div class="fb-seg-b" role="group" aria-labelledby="lTheme" id="fbThemes"></div></div>
      <div class="fb-seg"><span class="fb-seg-l" id="lSize">Size</span>
        <div class="fb-seg-b" role="group" aria-labelledby="lSize"><button type="button" data-board="size" data-v="S">S</button><button type="button" data-board="size" data-v="M">M</button><button type="button" data-board="size" data-v="L">L</button></div></div>
    </div>
  </div>
</header>
<main class="fb-main" id="fbMain"></main>
<script>
(function(){{
'use strict';
{pre}
{body}
{post}
}})();
</script>
'''
open(out, 'w').write(html)
print('wrote', out, len(html))
