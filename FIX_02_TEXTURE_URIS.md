# FIX 02 - texture is invisible, the data URIs were double encoded

## What went wrong

FIX_01_TEXTURE.md contained corrupted data URIs. When they were generated, the `%`
characters were themselves URL encoded, so `%23` (a `#`) became `%2523`. The result
is that every `stroke` attribute holds an invalid colour string, the hexagons draw
with no stroke, and the texture renders as nothing at all. The page currently shows
a flat background with no pattern.

This was a fault in the fix document, not in your implementation. The geometry and
the sizes you applied were correct and must be kept.

## What to change

In `src/index.css`, replace ONLY the four data URI values below. Every one of these
has been parsed, rendered and verified.

Keep everything else exactly as it is now: all six size declarations stay at
`13.86px 24px`, the `.tex-grain` URI stays untouched, and the Layout.tsx wrapper fix
from FIX_01 stays as it is.

### Verification before you paste

Each corrected URI contains `%23` and does NOT contain `%25`. If you see `%25`
anywhere in a value you are about to write, it is the broken version, stop.

### .tex-emboss
```css
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2713.86%27%20height%3D%2724.0%27%20viewBox%3D%270%200%2013.86%2024.0%27%3E%3Cpolygon%20points%3D%276.93%2C-1.2%2013.86%2C2.8%2013.86%2C10.8%206.93%2C14.8%200.0%2C10.8%200.0%2C2.8%27%20fill%3D%27none%27%20stroke%3D%27%230E1013%27%20stroke-opacity%3D%270.16%27%20stroke-width%3D%270.6%27%2F%3E%3Cpolygon%20points%3D%276.93%2C22.8%2013.86%2C26.8%2013.86%2C34.8%206.93%2C38.8%200.0%2C34.8%200.0%2C26.8%27%20fill%3D%27none%27%20stroke%3D%27%230E1013%27%20stroke-opacity%3D%270.16%27%20stroke-width%3D%270.6%27%2F%3E%3Cpolygon%20points%3D%270%2C10.8%206.93%2C14.8%206.93%2C22.8%200%2C26.8%20-6.93%2C22.8%20-6.93%2C14.8%27%20fill%3D%27none%27%20stroke%3D%27%230E1013%27%20stroke-opacity%3D%270.16%27%20stroke-width%3D%270.6%27%2F%3E%3Cpolygon%20points%3D%2713.86%2C10.8%2020.79%2C14.8%2020.79%2C22.8%2013.86%2C26.8%206.93%2C22.8%206.93%2C14.8%27%20fill%3D%27none%27%20stroke%3D%27%230E1013%27%20stroke-opacity%3D%270.16%27%20stroke-width%3D%270.6%27%2F%3E%3Cpolygon%20points%3D%276.93%2C-2.0%2013.86%2C2.0%2013.86%2C10.0%206.93%2C14.0%200.0%2C10.0%200.0%2C2.0%27%20fill%3D%27none%27%20stroke%3D%27%23FFFFFF%27%20stroke-opacity%3D%270.95%27%20stroke-width%3D%270.7%27%2F%3E%3Cpolygon%20points%3D%276.93%2C22.0%2013.86%2C26.0%2013.86%2C34.0%206.93%2C38.0%200.0%2C34.0%200.0%2C26.0%27%20fill%3D%27none%27%20stroke%3D%27%23FFFFFF%27%20stroke-opacity%3D%270.95%27%20stroke-width%3D%270.7%27%2F%3E%3Cpolygon%20points%3D%270%2C10.0%206.93%2C14.0%206.93%2C22.0%200%2C26.0%20-6.93%2C22.0%20-6.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23FFFFFF%27%20stroke-opacity%3D%270.95%27%20stroke-width%3D%270.7%27%2F%3E%3Cpolygon%20points%3D%2713.86%2C10.0%2020.79%2C14.0%2020.79%2C22.0%2013.86%2C26.0%206.93%2C22.0%206.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23FFFFFF%27%20stroke-opacity%3D%270.95%27%20stroke-width%3D%270.7%27%2F%3E%3C%2Fsvg%3E");
```

### .tex-tint  (identical value for both properties)
```css
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2713.86%27%20height%3D%2724.0%27%20viewBox%3D%270%200%2013.86%2024.0%27%3E%3Cpolygon%20points%3D%276.93%2C-2.0%2013.86%2C2.0%2013.86%2C10.0%206.93%2C14.0%200.0%2C10.0%200.0%2C2.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.8%27%2F%3E%3Cpolygon%20points%3D%276.93%2C22.0%2013.86%2C26.0%2013.86%2C34.0%206.93%2C38.0%200.0%2C34.0%200.0%2C26.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.8%27%2F%3E%3Cpolygon%20points%3D%270%2C10.0%206.93%2C14.0%206.93%2C22.0%200%2C26.0%20-6.93%2C22.0%20-6.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.8%27%2F%3E%3Cpolygon%20points%3D%2713.86%2C10.0%2020.79%2C14.0%2020.79%2C22.0%2013.86%2C26.0%206.93%2C22.0%206.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.8%27%2F%3E%3C%2Fsvg%3E");
          mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2713.86%27%20height%3D%2724.0%27%20viewBox%3D%270%200%2013.86%2024.0%27%3E%3Cpolygon%20points%3D%276.93%2C-2.0%2013.86%2C2.0%2013.86%2C10.0%206.93%2C14.0%200.0%2C10.0%200.0%2C2.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.8%27%2F%3E%3Cpolygon%20points%3D%276.93%2C22.0%2013.86%2C26.0%2013.86%2C34.0%206.93%2C38.0%200.0%2C34.0%200.0%2C26.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.8%27%2F%3E%3Cpolygon%20points%3D%270%2C10.0%206.93%2C14.0%206.93%2C22.0%200%2C26.0%20-6.93%2C22.0%20-6.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.8%27%2F%3E%3Cpolygon%20points%3D%2713.86%2C10.0%2020.79%2C14.0%2020.79%2C22.0%2013.86%2C26.0%206.93%2C22.0%206.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.8%27%2F%3E%3C%2Fsvg%3E");
```

### .tex-dark
```css
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2713.86%27%20height%3D%2724.0%27%20viewBox%3D%270%200%2013.86%2024.0%27%3E%3Cpolygon%20points%3D%276.93%2C-1.2%2013.86%2C2.8%2013.86%2C10.8%206.93%2C14.8%200.0%2C10.8%200.0%2C2.8%27%20fill%3D%27none%27%20stroke%3D%27%23FFFFFF%27%20stroke-opacity%3D%270.12%27%20stroke-width%3D%270.6%27%2F%3E%3Cpolygon%20points%3D%276.93%2C22.8%2013.86%2C26.8%2013.86%2C34.8%206.93%2C38.8%200.0%2C34.8%200.0%2C26.8%27%20fill%3D%27none%27%20stroke%3D%27%23FFFFFF%27%20stroke-opacity%3D%270.12%27%20stroke-width%3D%270.6%27%2F%3E%3Cpolygon%20points%3D%270%2C10.8%206.93%2C14.8%206.93%2C22.8%200%2C26.8%20-6.93%2C22.8%20-6.93%2C14.8%27%20fill%3D%27none%27%20stroke%3D%27%23FFFFFF%27%20stroke-opacity%3D%270.12%27%20stroke-width%3D%270.6%27%2F%3E%3Cpolygon%20points%3D%2713.86%2C10.8%2020.79%2C14.8%2020.79%2C22.8%2013.86%2C26.8%206.93%2C22.8%206.93%2C14.8%27%20fill%3D%27none%27%20stroke%3D%27%23FFFFFF%27%20stroke-opacity%3D%270.12%27%20stroke-width%3D%270.6%27%2F%3E%3Cpolygon%20points%3D%276.93%2C-2.0%2013.86%2C2.0%2013.86%2C10.0%206.93%2C14.0%200.0%2C10.0%200.0%2C2.0%27%20fill%3D%27none%27%20stroke%3D%27%23000000%27%20stroke-opacity%3D%270.5%27%20stroke-width%3D%270.7%27%2F%3E%3Cpolygon%20points%3D%276.93%2C22.0%2013.86%2C26.0%2013.86%2C34.0%206.93%2C38.0%200.0%2C34.0%200.0%2C26.0%27%20fill%3D%27none%27%20stroke%3D%27%23000000%27%20stroke-opacity%3D%270.5%27%20stroke-width%3D%270.7%27%2F%3E%3Cpolygon%20points%3D%270%2C10.0%206.93%2C14.0%206.93%2C22.0%200%2C26.0%20-6.93%2C22.0%20-6.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23000000%27%20stroke-opacity%3D%270.5%27%20stroke-width%3D%270.7%27%2F%3E%3Cpolygon%20points%3D%2713.86%2C10.0%2020.79%2C14.0%2020.79%2C22.0%2013.86%2C26.0%206.93%2C22.0%206.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23000000%27%20stroke-opacity%3D%270.5%27%20stroke-width%3D%270.7%27%2F%3E%3C%2Fsvg%3E");
```

### .tex-glow  (identical value for both properties)
```css
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2713.86%27%20height%3D%2724.0%27%20viewBox%3D%270%200%2013.86%2024.0%27%3E%3Cpolygon%20points%3D%276.93%2C-2.0%2013.86%2C2.0%2013.86%2C10.0%206.93%2C14.0%200.0%2C10.0%200.0%2C2.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.85%27%2F%3E%3Cpolygon%20points%3D%276.93%2C22.0%2013.86%2C26.0%2013.86%2C34.0%206.93%2C38.0%200.0%2C34.0%200.0%2C26.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.85%27%2F%3E%3Cpolygon%20points%3D%270%2C10.0%206.93%2C14.0%206.93%2C22.0%200%2C26.0%20-6.93%2C22.0%20-6.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.85%27%2F%3E%3Cpolygon%20points%3D%2713.86%2C10.0%2020.79%2C14.0%2020.79%2C22.0%2013.86%2C26.0%206.93%2C22.0%206.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.85%27%2F%3E%3C%2Fsvg%3E");
          mask-image: url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2713.86%27%20height%3D%2724.0%27%20viewBox%3D%270%200%2013.86%2024.0%27%3E%3Cpolygon%20points%3D%276.93%2C-2.0%2013.86%2C2.0%2013.86%2C10.0%206.93%2C14.0%200.0%2C10.0%200.0%2C2.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.85%27%2F%3E%3Cpolygon%20points%3D%276.93%2C22.0%2013.86%2C26.0%2013.86%2C34.0%206.93%2C38.0%200.0%2C34.0%200.0%2C26.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.85%27%2F%3E%3Cpolygon%20points%3D%270%2C10.0%206.93%2C14.0%206.93%2C22.0%200%2C26.0%20-6.93%2C22.0%20-6.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.85%27%2F%3E%3Cpolygon%20points%3D%2713.86%2C10.0%2020.79%2C14.0%2020.79%2C22.0%2013.86%2C26.0%206.93%2C22.0%206.93%2C14.0%27%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-opacity%3D%271%27%20stroke-width%3D%270.85%27%2F%3E%3C%2Fsvg%3E");
```

## Check after applying

Run `npm run build`, then `npm run dev` and look at the page background. You should
see a fine interlocking honeycomb, roughly 14px across, that reads as embossed paper
rather than as an obvious pattern. If the background is still flat with no pattern
at all, a URI is still wrong.

Then grep `src/index.css` and confirm there is no `%25` anywhere in the file.

Do not start commit 4. Do not touch any other file.
