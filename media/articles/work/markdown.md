# Markdown [^]work/index)

This Markdown cheat sheet provides a quick overview of all the Markdown syntax
elements. It can’t cover every edge case, so if you need more information about
any of these elements, refer to the reference guides for
[basic syntax](https://www.markdownguide.org/basic-syntax) and
[extended syntax](https://www.markdownguide.org/extended-syntax).

## Basic Syntax

These are the elements outlined in John Gruber’s original design document. All
Markdown applications support these elements.

### Heading

```bash
# H1
## H2
### H3
```

### Bold

```bash
**bold text**
```

### Italic

```bash
*italicized text*
```

### Blockquote

```bash
> blockquote
```

### Ordered List

```bash
1. First item
2. Second item
3. Third item
```

### Unordered List

```bash
- First item
- Second item
- Third item
```

### Code

```bash
`code`
```

### Horizontal Rule

```bash
---
```

### Link

```bash
[Markdown Guide](https://www.markdownguide.org)
```

### Image

```bash
![alt text](https://www.markdownguide.org/assets/images/tux.png)
```

## Extended Syntax

These elements extend the basic syntax by adding additional features. Not all
Markdown applications support these elements.

### Table

```bash
| Syntax | Description |
| ----------- | ----------- |
| Header | Title |
| Paragraph | Text |
```

### Fenced Code Block

````bash
*```
{
  "firstName": "John",
  "lastName": "Smith",
  "age": 25
}
*```
````

### Footnote

```bash
Here's a sentence with a footnote. [^1]

[^1]: This is the footnote.
```

### Heading ID

```bash
### My Great Heading {#custom-id}
```

### Definition List

```bash
term
: definition
```

### Strikethrough

```bash
~~The world is flat.~~
```

### Task List

```bash
- [x] Write the press release
- [ ] Update the website
- [ ] Contact the media
```

### Emoji

```bash
That is so funny! :joy:
```

(See also
[Copying and Pasting Emoji](https://www.markdownguide.org/extended-syntax/#copying-and-pasting-emoji))

### Highlight

```bash
I need to highlight these ==very important words==.
```

### Subscript

```bash
H~2~O
```

### Superscript

```bash
X^2^
```
