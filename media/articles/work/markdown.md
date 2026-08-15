# Markdown [^]work/index)

Dieses Markdown-Spickzettel gibt dir einen schnellen Überblick über alle
Markdown-Syntax-Elemente. Es kann nicht jeden Spezialfall abdecken. Wenn du
mehr über eines dieser Elemente wissen willst, schau in die Referenzen für
[grundlegende Syntax](https://www.markdownguide.org/basic-syntax) und
[erweiterte Syntax](https://www.markdownguide.org/extended-syntax).

## Grundlegende Syntax

Das sind die Elemente aus dem ursprünglichen Entwurfsdokument von John Gruber.
Alle Markdown-Programme unterstützen diese Elemente.

### Überschrift

```bash
# H1
## H2
### H3
```

### Fett

```bash
**bold text**
```

### Kursiv

```bash
*italicized text*
```

### Zitat (Blockquote)

```bash
> blockquote
```

### Nummerierte Liste

```bash
1. First item
2. Second item
3. Third item
```

### Aufzählung

```bash
- First item
- Second item
- Third item
```

### Code

```bash
`code`
```

### Trennlinie

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

## Erweiterte Syntax

Diese Elemente erweitern die grundlegende Syntax um zusätzliche Funktionen.
Nicht alle Markdown-Programme unterstützen diese Elemente.

### Tabelle

```bash
| Syntax | Description |
| ----------- | ----------- |
| Header | Title |
| Paragraph | Text |
```

### Codeblock (Fenced)

````bash
*```
{
  "firstName": "John",
  "lastName": "Smith",
  "age": 25
}
*```
````

### Fußnote

```bash
Here's a sentence with a footnote. [^1]

[^1]: This is the footnote.
```

### Überschriften-ID

```bash
### My Great Heading {#custom-id}
```

### Definitionsliste

```bash
term
: definition
```

### Durchgestrichen

```bash
~~The world is flat.~~
```

### Aufgabenliste

```bash
- [x] Write the press release
- [ ] Update the website
- [ ] Contact the media
```

### Emoji

```bash
That is so funny! :joy:
```

(Siehe auch
[Emoji kopieren und einfügen](https://www.markdownguide.org/extended-syntax/#copying-and-pasting-emoji))

### Hervorheben

```bash
I need to highlight these ==very important words==.
```

### Tiefgestellt

```bash
H~2~O
```

### Hochgestellt

```bash
X^2^
```
