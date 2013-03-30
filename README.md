# Nodepaper

Nodepaper is a blog engine similar in style to [Wheat](https://github.com/creationix/wheat) and [Scriptogram](http://scriptogr.am/).

## Purpose

The purpose of Nodepaper was strictly to get me writing more. I prefer authoring content as Markdown pages, and really appreciated the preamble-whitespace-content style of [Wheat](https://github.com/creationix/wheat) and [Scriptogram](http://scriptogr.am/). Making things even simpler, the feature supported by Nodepaper are the _intersection_ of [Wheat](https://github.com/creationix/wheat) and [Scriptogram](http://scriptogr.am/), not the union. As such, there's no multi-author support, no comments, and no "advanced" options like "Slug" in the preamble.

## How to Use

 1. Start a new project as a Node.js module, complete with its own `package.json` file.
 2. Install nodepaper as a dependency with `npm install nodepaper --save`.
 3. Create up to two directories. One for the theme (optional), and one for your content (not optional).
 4. Add an `npm start` script to `package.json`, invoking `nodepaper` with the directories from step 3.
 5. Enjoy!

For an example project, see [the schoonology.com source](https://github.com/Schoonology/schoonology.com).

## License

    Copyright (C) 2012-2013 Michael Schoonmaker (michael.r.schoonmaker@gmail.com)

    This project is free software released under the MIT/X11 license:

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

