YOJNA PORTAL – 9 MONOCHROME SVG ICONS

All icons use currentColor (no fixed color palette).
Files:
briefcase.svg
schemes-leaf.svg
education-book.svg
admit-card.svg
results-trophy.svg
pdf-document.svg
scholarship-graduation.svg
quick-links.svg
upcoming-bell.svg

Hugo note:
For CSS-controlled currentColor, inline the SVG markup through a Hugo partial.
Example inside a partial:
{{ readFile "static/icons/briefcase.svg" | safeHTML }}

Then style the inline SVG wrapper:
.section-icon { color: #e88713; width: 36px; height: 36px; }
The SVG uses currentColor, so its strokes and fills follow the CSS color.

An external <img src="...svg"> does not inherit the parent element's color.
