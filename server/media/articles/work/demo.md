# Über [^](/articles/)

## Einleitung

### Lorem ipsum ....

[Home](app/)

[About](app/imprint)

[Imprint](app/imprint)

<h1 class="text-3xl text-green-500">Attack</h1>
<h1 class="text-3xl text-red-300 font-bold underline">
      Hello world!
    </h1>

    ---

**Werbung :)**

- **[pica](https://nodeca.github.io/pica/demo/)** - hochwertiges und schnelles
  Bildgrößenändern im Browser.
- **[babelfish](https://github.com/nodeca/babelfish/)** - entwicklerfreundliches
  i18n mit Plural-Unterstützung und einfacher Syntax.

Diese Projekte wirst du mögen!

---

# h1 Überschrift 8-)

## h2 Überschrift

### h3 Überschrift

#### h4 Überschrift

##### h5 Überschrift

###### h6 Überschrift

## Horizontale Linien

---

---

---

## Typografische Ersetzungen

Aktiviere die typographer-Option, um das Ergebnis zu sehen.

(c) (C) (r) (R) (tm) (TM) (p) (P) +-

test.. test... test..... test?..... test!....

!!!!!! ???? ,, -- ---

"Smartypants, double quotes" and 'single quotes'

## Hervorhebung

**This is bold text**

**This is bold text**

_This is italic text_

_This is italic text_

~~Strikethrough~~

## Zitate

> Zitate können auch verschachtelt werden...
>
>> ...indem du zusätzliche >-Zeichen direkt nebeneinander setzt...
>>
>>> ...oder mit Leerzeichen zwischen den Pfeilen.

## Listen

Unsortiert

- Erstelle eine Liste, indem du eine Zeile mit `+`, `-` oder `*` beginnst
- Unterlisten erstellst du, indem du 2 Leerzeichen einrückst:
  - Ein anderes Listenzeichen startet eine neue Liste:
    - Ac tristique libero volutpat at
    * Facilisis in pretium nisl aliquet
    - Nulla volutpat aliquam velit
- Ganz einfach!

Sortiert

1. Lorem ipsum dolor sit amet
2. Consectetur adipiscing elit
3. Integer molestie lorem at massa

4. Du kannst fortlaufende Zahlen verwenden...
5. ...oder alle Zahlen als `1.` lassen

Nummerierung mit Versatz starten:

57. foo
58. bar

## Code

Inline-`code`

Eingerückter Code

    // Some comments
    line 1 of code
    line 2 of code
    line 3 of code

Codeblock mit "Fences"

```
Sample text here...
```

Syntaxhervorhebung

```js
var foo = function (bar) {
  return bar++;
};

console.log(foo(5));
```

## Tabellen

| Option | Beschreibung                                                             |
| ------ | ------------------------------------------------------------------------ |
| data   | Pfad zu den Datendateien, die an die Vorlagen übergeben werden.          |
| engine | Engine zum Verarbeiten der Vorlagen. Handlebars ist die Standard-Engine. |
| ext    | Dateiendung für die Zieldateien.                                         |

Rechtsbündige Spalten

| Option |                                                          Beschreibung |
| -----: | ---------------------------------------------------------------------: |
|   data |      Pfad zu den Datendateien, die an die Vorlagen übergeben werden. |
| engine | Engine zum Verarbeiten der Vorlagen. Handlebars ist die Standard-Engine. |
|    ext |                                    Dateiendung für die Zieldateien. |

## Links

[link text](http://dev.nodeca.com)

[link with title](http://nodeca.github.io/pica/demo/ "title text!")

Automatisch umgewandelter Link https://github.com/nodeca/pica (aktiviere linkify, um es zu sehen)

## Bilder

![Minion](https://octodex.github.com/images/minion.png)
![Stormtroopocat](https://octodex.github.com/images/stormtroopocat.jpg 'The Stormtroopocat')

Wie Links haben auch Bilder eine Fußnoten-Syntax

![Alt text][id]

Mit einer Referenz weiter unten im Dokument, die die URL festlegt:

[id]: https://octodex.github.com/images/dojocat.jpg 'The Dojocat'

## Plugins

Die Killer-Funktion von `markdown-it` ist die sehr gute Unterstützung von
[Syntax-Plugins](https://www.npmjs.org/browse/keyword/markdown-it-plugin).

### [Emojies](https://github.com/markdown-it/markdown-it-emoji)

> Klassisches Markup: :wink: :cry: :laughing: :yum:
>
> Kürzel (Emoticons): :-) :-( 8-) ;)

Siehe
[wie du die Ausgabe änderst](https://github.com/markdown-it/markdown-it-emoji#change-output)
mit twemoji.

### [Tiefgestellt](https://github.com/markdown-it/markdown-it-sub) / [Hochgestellt](https://github.com/markdown-it/markdown-it-sup)

- 19^th^
- H~2~O

### [\<ins>](https://github.com/markdown-it/markdown-it-ins)

++Eingefügter Text++

### [\<mark>](https://github.com/markdown-it/markdown-it-mark)

==Markierter Text==

### [Fußnoten](https://github.com/markdown-it/markdown-it-footnote)

Fußnote 1-Link[^first].

Fußnote 2-Link[^second].

Inline-Fußnote^[Text der Inline-Fußnote] Definition.

Doppelte Fußnoten-Referenz[^second].

[^first]: Fußnoten **können Markup enthalten**

    und mehrere Absätze.

[^second]: Fußnotentext.

### [Definitionslisten](https://github.com/markdown-it/markdown-it-deflist)

Begriff 1

: Definition 1 mit träger Fortsetzung.

Begriff 2 mit _Inline-Markup_

: Definition 2

        { some code, part of Definition 2 }

    Dritter Absatz von Definition 2.

_Kompakter Stil:_

Begriff 1 ~ Definition 1

Begriff 2 ~ Definition 2a ~ Definition 2b

### [Abkürzungen](https://github.com/markdown-it/markdown-it-abbr)

Das ist ein Beispiel für eine HTML-Abkürzung.

Es ersetzt "HTML", lässt aber Teile wie "xxxHTMLyyy" und so weiter unverändert.

\*[HTML]: Hyper Text Markup Language

### [Eigene Container](https://github.com/markdown-it/markdown-it-container)

::: warning _hier gibt es Drachen_ :::
