## FIX 1 of 2 - replace the four texture data URIs in `src/index.css`

The hexagons in Section 6 do not tile correctly. The tile was 14x24 but the hexagon
inside it is only 14.8 tall, leaving a 9px vertical gap, so the pattern renders as
rows of separated rings instead of an interlocking honeycomb.

The corrected tile is 13.86 x 24 and contains four hexagon positions so the rows
interlock and repeat seamlessly. The geometry is verified.

Replace the `background-image` on `.tex-emboss`, the two `mask-image` values on
`.tex-tint`, the `background-image` on `.tex-dark`, and the two `mask-image` values
on `.tex-glow`. Also change every `background-size` and `mask-size` from
`14px 24px` to `13.86px 24px`. Change nothing else in those rules.

### .tex-emboss
```css
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='13.86'%20height='24.0'%20viewBox='0%200%2013.86%2024.0'%3E%3Cpolygon%20points='6.93,-1.2%2013.86,2.8%2013.86,10.8%206.93,14.8%200.0,10.8%200.0,2.8'%20fill='none'%20stroke='%25230E1013'%20stroke-opacity='0.16'%20stroke-width='0.6'/%3E%3Cpolygon%20points='6.93,22.8%2013.86,26.8%2013.86,34.8%206.93,38.8%200.0,34.8%200.0,26.8'%20fill='none'%20stroke='%25230E1013'%20stroke-opacity='0.16'%20stroke-width='0.6'/%3E%3Cpolygon%20points='0,10.8%206.93,14.8%206.93,22.8%200,26.8%20-6.93,22.8%20-6.93,14.8'%20fill='none'%20stroke='%25230E1013'%20stroke-opacity='0.16'%20stroke-width='0.6'/%3E%3Cpolygon%20points='13.86,10.8%2020.79,14.8%2020.79,22.8%2013.86,26.8%206.93,22.8%206.93,14.8'%20fill='none'%20stroke='%25230E1013'%20stroke-opacity='0.16'%20stroke-width='0.6'/%3E%3Cpolygon%20points='6.93,-2.0%2013.86,2.0%2013.86,10.0%206.93,14.0%200.0,10.0%200.0,2.0'%20fill='none'%20stroke='%2523FFFFFF'%20stroke-opacity='0.95'%20stroke-width='0.7'/%3E%3Cpolygon%20points='6.93,22.0%2013.86,26.0%2013.86,34.0%206.93,38.0%200.0,34.0%200.0,26.0'%20fill='none'%20stroke='%2523FFFFFF'%20stroke-opacity='0.95'%20stroke-width='0.7'/%3E%3Cpolygon%20points='0,10.0%206.93,14.0%206.93,22.0%200,26.0%20-6.93,22.0%20-6.93,14.0'%20fill='none'%20stroke='%2523FFFFFF'%20stroke-opacity='0.95'%20stroke-width='0.7'/%3E%3Cpolygon%20points='13.86,10.0%2020.79,14.0%2020.79,22.0%2013.86,26.0%206.93,22.0%206.93,14.0'%20fill='none'%20stroke='%2523FFFFFF'%20stroke-opacity='0.95'%20stroke-width='0.7'/%3E%3C/svg%3E");
  background-size: 13.86px 24px;
```

### .tex-tint  (use the same value for -webkit-mask-image and mask-image)
```css
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='13.86'%20height='24.0'%20viewBox='0%200%2013.86%2024.0'%3E%3Cpolygon%20points='6.93,-2.0%2013.86,2.0%2013.86,10.0%206.93,14.0%200.0,10.0%200.0,2.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.8'/%3E%3Cpolygon%20points='6.93,22.0%2013.86,26.0%2013.86,34.0%206.93,38.0%200.0,34.0%200.0,26.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.8'/%3E%3Cpolygon%20points='0,10.0%206.93,14.0%206.93,22.0%200,26.0%20-6.93,22.0%20-6.93,14.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.8'/%3E%3Cpolygon%20points='13.86,10.0%2020.79,14.0%2020.79,22.0%2013.86,26.0%206.93,22.0%206.93,14.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.8'/%3E%3C/svg%3E");
          mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='13.86'%20height='24.0'%20viewBox='0%200%2013.86%2024.0'%3E%3Cpolygon%20points='6.93,-2.0%2013.86,2.0%2013.86,10.0%206.93,14.0%200.0,10.0%200.0,2.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.8'/%3E%3Cpolygon%20points='6.93,22.0%2013.86,26.0%2013.86,34.0%206.93,38.0%200.0,34.0%200.0,26.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.8'/%3E%3Cpolygon%20points='0,10.0%206.93,14.0%206.93,22.0%200,26.0%20-6.93,22.0%20-6.93,14.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.8'/%3E%3Cpolygon%20points='13.86,10.0%2020.79,14.0%2020.79,22.0%2013.86,26.0%206.93,22.0%206.93,14.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.8'/%3E%3C/svg%3E");
  -webkit-mask-size: 13.86px 24px;
          mask-size: 13.86px 24px;
```

### .tex-dark
```css
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='13.86'%20height='24.0'%20viewBox='0%200%2013.86%2024.0'%3E%3Cpolygon%20points='6.93,-1.2%2013.86,2.8%2013.86,10.8%206.93,14.8%200.0,10.8%200.0,2.8'%20fill='none'%20stroke='%2523FFFFFF'%20stroke-opacity='0.12'%20stroke-width='0.6'/%3E%3Cpolygon%20points='6.93,22.8%2013.86,26.8%2013.86,34.8%206.93,38.8%200.0,34.8%200.0,26.8'%20fill='none'%20stroke='%2523FFFFFF'%20stroke-opacity='0.12'%20stroke-width='0.6'/%3E%3Cpolygon%20points='0,10.8%206.93,14.8%206.93,22.8%200,26.8%20-6.93,22.8%20-6.93,14.8'%20fill='none'%20stroke='%2523FFFFFF'%20stroke-opacity='0.12'%20stroke-width='0.6'/%3E%3Cpolygon%20points='13.86,10.8%2020.79,14.8%2020.79,22.8%2013.86,26.8%206.93,22.8%206.93,14.8'%20fill='none'%20stroke='%2523FFFFFF'%20stroke-opacity='0.12'%20stroke-width='0.6'/%3E%3Cpolygon%20points='6.93,-2.0%2013.86,2.0%2013.86,10.0%206.93,14.0%200.0,10.0%200.0,2.0'%20fill='none'%20stroke='%2523000000'%20stroke-opacity='0.5'%20stroke-width='0.7'/%3E%3Cpolygon%20points='6.93,22.0%2013.86,26.0%2013.86,34.0%206.93,38.0%200.0,34.0%200.0,26.0'%20fill='none'%20stroke='%2523000000'%20stroke-opacity='0.5'%20stroke-width='0.7'/%3E%3Cpolygon%20points='0,10.0%206.93,14.0%206.93,22.0%200,26.0%20-6.93,22.0%20-6.93,14.0'%20fill='none'%20stroke='%2523000000'%20stroke-opacity='0.5'%20stroke-width='0.7'/%3E%3Cpolygon%20points='13.86,10.0%2020.79,14.0%2020.79,22.0%2013.86,26.0%206.93,22.0%206.93,14.0'%20fill='none'%20stroke='%2523000000'%20stroke-opacity='0.5'%20stroke-width='0.7'/%3E%3C/svg%3E");
  background-size: 13.86px 24px;
```

### .tex-glow  (use the same value for -webkit-mask-image and mask-image)
```css
  -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='13.86'%20height='24.0'%20viewBox='0%200%2013.86%2024.0'%3E%3Cpolygon%20points='6.93,-2.0%2013.86,2.0%2013.86,10.0%206.93,14.0%200.0,10.0%200.0,2.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.85'/%3E%3Cpolygon%20points='6.93,22.0%2013.86,26.0%2013.86,34.0%206.93,38.0%200.0,34.0%200.0,26.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.85'/%3E%3Cpolygon%20points='0,10.0%206.93,14.0%206.93,22.0%200,26.0%20-6.93,22.0%20-6.93,14.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.85'/%3E%3Cpolygon%20points='13.86,10.0%2020.79,14.0%2020.79,22.0%2013.86,26.0%206.93,22.0%206.93,14.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.85'/%3E%3C/svg%3E");
          mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='13.86'%20height='24.0'%20viewBox='0%200%2013.86%2024.0'%3E%3Cpolygon%20points='6.93,-2.0%2013.86,2.0%2013.86,10.0%206.93,14.0%200.0,10.0%200.0,2.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.85'/%3E%3Cpolygon%20points='6.93,22.0%2013.86,26.0%2013.86,34.0%206.93,38.0%200.0,34.0%200.0,26.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.85'/%3E%3Cpolygon%20points='0,10.0%206.93,14.0%206.93,22.0%200,26.0%20-6.93,22.0%20-6.93,14.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.85'/%3E%3Cpolygon%20points='13.86,10.0%2020.79,14.0%2020.79,22.0%2013.86,26.0%206.93,22.0%206.93,14.0'%20fill='none'%20stroke='%2523fff'%20stroke-opacity='1'%20stroke-width='0.85'/%3E%3C/svg%3E");
  -webkit-mask-size: 13.86px 24px;
          mask-size: 13.86px 24px;
```

---

## FIX 2 of 2 - the footer is being painted over by the page texture

In the running app the light background texture is rendering ON TOP of the dark
footer, drawing bright white hexagons across the footer text and making it
unreadable. This is a stacking bug, not a texture bug.

Cause: the three `.tex-layer` divs are `position: fixed` and cover the whole
viewport. Only content inside a wrapper with `relative z-[1]` sits above them.
The footer is currently outside that wrapper.

Fix in `src/components/layout/Layout.tsx`:

1. The three `.tex-layer` divs stay exactly where they are, as the first children.
2. **Every other thing in the layout must be inside a single wrapper element with
   `className="relative z-[1]"`.** That means the Header, the animated main outlet,
   the Footer, the CartDrawer and the CheckoutModal. Nothing may be left outside it.
3. Do not raise the z-index of the texture layers. They stay at `z-0`.

Verify after the change: the footer must show ONLY its own dark texture, which is
faint white and dark hexagons at low contrast. If you can read the footer links
clearly against a near-black background, it is correct. If the hexagons on the
footer look bright white and high contrast, the wrapper is still wrong.

---

## Do not do anything else

Do not start commit 4. Do not touch any other file. Run `npm run build` and report.
