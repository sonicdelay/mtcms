# Tailwind

A literal "full list" of Tailwind CSS utilities would contain thousands of classes because many utilities are generated from scales (spacing, colors, widths, z-indexes, breakpoints, etc.). The documentation organizes them by category rather than as one flat list.

Below is a comprehensive category reference showing the major Tailwind utility families and patterns.

## Layout
Utility Pattern	Effectblock	display:block
inline-block	display:inline-block
inline	display:inline
flex	display:flex
inline-flex	display:inline-flex
grid	display:grid
inline-grid	display:inline-grid
hidden	display:none
contents	display:contents
container	Responsive container width

## Position
Utility Pattern	Effectstatic	Static positioning
relative	Relative positioning
absolute	Absolute positioning
fixed	Fixed positioning
sticky	Sticky positioning
top-*	Top offset
right-*	Right offset
bottom-*	Bottom offset
left-*	Left offset
inset-*	Set all offsets

## Flexbox
Utility Pattern	Effectflex-row	Horizontal flex layout
flex-col	Vertical flex layout
flex-wrap	Wrap items
flex-nowrap	No wrapping
grow	flex-grow:1
grow-0	No growth
shrink	flex-shrink:1
shrink-0	No shrinking
basis-*	Flex basis
flex-1	Flexible item
flex-auto	Automatic flex sizing

## Alignment
Utility Pattern	Effectitems-start	Align items start
items-center	Align items center
items-end	Align items end
justify-start	Justify start
justify-center	Justify center
justify-between	Space between
justify-around	Space around
content-center	Align content center
self-center	Align single item

## Grid
Utility Pattern	Effectgrid-cols-*	Number of columns
grid-rows-*	Number of rows
col-span-*	Column span
row-span-*	Row span
col-start-*	Column start
row-start-*	Row start
auto-cols-*	Auto columns
auto-rows-*	Auto rows

## Spacing
Utility Pattern	Effectp-*	Padding all sides
px-*	Horizontal padding
py-*	Vertical padding
pt-*	Padding top
pr-*	Padding right
pb-*	Padding bottom
pl-*	Padding left
m-*	Margin all sides
mx-*	Horizontal margin
my-*	Vertical margin
space-x-*	Horizontal spacing between children
space-y-*	Vertical spacing between children
gap-*	Grid/Flex gap

## Sizing
Utility Pattern	Effectw-*	Width
h-*	Height
size-*	Width and height
min-w-*	Minimum width
max-w-*	Maximum width
min-h-*	Minimum height
max-h-*	Maximum height
w-full	Width 100%
h-screen	Viewport height

## Typography
Utility Pattern	Effectfont-sans	Sans font
font-serif	Serif font
font-mono	Monospace font
text-xs → text-9xl	Font size
font-thin → font-black	Font weight
italic	Italic text
not-italic	Remove italic
leading-*	Line height
tracking-*	Letter spacing
uppercase	Uppercase
lowercase	Lowercase
capitalize	Capitalize
truncate	Single-line truncation
line-clamp-*	Multi-line truncation

## Text Color
Utility Pattern	Effecttext-black	Black text
text-white	White text
text-gray-*	Gray text
text-red-*	Red text
text-blue-*	Blue text
text-green-*	Green text
text-yellow-*	Yellow text
text-purple-*	Purple text

## Backgrounds
Utility Pattern	Effectbg-*	Background color
bg-none	No background
bg-cover	Cover container
bg-contain	Contain image
bg-center	Center image
bg-top	Position top
bg-bottom	Position bottom
bg-gradient-to-r	Gradient background
from-*	Gradient start
via-*	Gradient middle
to-*	Gradient end

## Borders
Utility Pattern	Effectborder	Border
border-0	Remove border
border-*	Border width
border-red-*	Border color
rounded	Border radius
rounded-sm	Small radius
rounded-lg	Large radius
rounded-xl	Extra-large radius
rounded-full	Pill/Circle

## Effects
Utility Pattern	Effectshadow-sm	Small shadow
shadow	Default shadow
shadow-lg	Large shadow
shadow-xl	Extra-large shadow
shadow-none	Remove shadow
opacity-*	Opacity
mix-blend-*	Blend mode

## Filters
Utility Pattern	Effectblur-*	Blur filter
brightness-*	Brightness
contrast-*	Contrast
grayscale	Grayscale
invert	Invert colors
sepia	Sepia filter
saturate-*	Saturation

## Tables
Utility Pattern	Effecttable-auto	Automatic sizing
table-fixed	Fixed sizing
border-collapse	Collapse borders
border-separate	Separate borders

## Transitions
Utility Pattern	Effecttransition	Enable transitions
transition-colors	Color transitions
duration-*	Duration
delay-*	Delay
ease-in	Ease in
ease-out	Ease out
ease-in-out	Ease in/out

## Transforms
Utility Pattern	Effectscale-*	Scale
rotate-*	Rotate
translate-x-*	Horizontal move
translate-y-*	Vertical move
skew-x-*	Horizontal skew
skew-y-*	Vertical skew
transform-gpu	GPU acceleration

## Animation
Utility Pattern	Effectanimate-spin	Continuous rotation
animate-pulse	Pulsing
animate-ping	Ping effect
animate-bounce	Bounce animation
animate-none	No animation

## Interactivity
Utility Pattern	Effectcursor-pointer	Pointer cursor
cursor-not-allowed	Disabled cursor
select-none	Prevent selection
resize	Allow resizing
resize-none	Disable resizing
scroll-smooth	Smooth scrolling

## Overflow
Utility Pattern	Effectoverflow-auto	Auto scrollbars
overflow-hidden	Hide overflow
overflow-scroll	Always scroll
overflow-x-auto	Horizontal scrolling
overflow-y-auto	Vertical scrolling

## Z-Index
Utility Pattern	Effectz-0	z-index:0
z-10	z-index:10
z-20	z-index:20
z-50	z-index:50
z-auto	Automatic

## Responsive Variants
Utility Pattern	Effectsm:*	Apply at small breakpoint
md:*	Apply at medium breakpoint
lg:*	Apply at large breakpoint
xl:*	Apply at extra-large breakpoint
2xl:*	Apply at 2XL breakpoint

## State Variants
Utility Pattern	Effecthover:*	Hover state
focus:*	Focus state
active:*	Active state
disabled:*	Disabled state
visited:*	Visited links
checked:*	Checked inputs
focus-visible:*	Visible focus state

## Dark Mode
Utility Pattern	Effectdark:*	Apply utility in dark mode

## Accessibility
Utility Pattern	Effectsr-only	Screen reader only
not-sr-only	Restore visibility

These categories cover the complete utility system documented by Tailwind. Individual utilities are generated from scales such as spacing (0, 1, 2, 4, 8, etc.), colors (red-50 through red-950, etc.), widths, heights, opacity values, and breakpoints, producing thousands of concrete class names.