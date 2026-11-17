# Rubber Band

**Live:** https://vishnuvsdevtech.github.io/rubber-band/

Two mechanisms, one idea: a limit you can feel.

**Vertical overscroll.** Wheel or drag feeds a raw target; what you see is
`rubber(target)` — 36 % of the excess, so the pull gets harder the further you go
without ever becoming impossible. Release and a spring (not an ease) returns it.

**Horizontal fling.** Drag with velocity, 6 % friction per frame, bounce at the
ends. Tiles lean into their own velocity, because a body moving fast is rarely
upright.

**Why it feels authored:** native scrolling can only stop. Here the interface
resists, gives, and comes back — which is the difference between a document and
an object.

**Costs:** one rAF loop per axis, transforms only, no layout thrash.
