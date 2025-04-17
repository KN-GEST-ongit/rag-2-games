# SCRIPTS README

### _generateGameFiles.js_

This script is designed to generate all necessary files
and update existing ones during the process of creating
a new game in the **RAG-2-GAMES-LIB** for main **RAG-2 system**.

The script creates or modifies the following files (in lib directory):

- _rag-2-games-lib.component.ts.ts_
- _data/games.ts_
- _games/[newGameName]/[newGameName].component.ts_
- _games/[newGameName]/models/[newGameName].class.ts_

Then you need to implement the rest of the game's
functionality like logic and view in some of these files.

How to use the script?
In the console, run the following command:

```
npm run games:new [newGameName]
```

The [newGameName] should be written in lowercase letters as
a single string, even for multi-word game names (e.g.,
"FlappyBird" should be written as "flappybird").

<hr>
