const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const CLI_TARGET_PATH = 'src/lib/games';
const PROJECT_TARGET_PATH = 'projects/rag-2-games-lib/src/lib/games';
const GAMES_TS_PATH = 'projects/rag-2-games-lib/src/lib/data/games.ts';
const RAG_2_GAMES_LIB_PATH =
  'projects/rag-2-games-lib/src/lib/rag-2-games-lib.component.ts';

function generateGameFiles(gameName) {
  if (!gameName) {
    console.error('Error: Component name is required.');
    process.exit(1);
  }

  const componentPath = path.join(PROJECT_TARGET_PATH, gameName);
  const modelsPath = path.join(componentPath, 'models');
  const classFilePath = path.join(modelsPath, `${gameName}.class.ts`);
  const componentFilePath = path.join(
    componentPath,
    `${gameName}.component.ts`
  );
  const stateClassName = `${capitalize(gameName)}State`;
  const gameClassName = `${capitalize(gameName)}`;

  const command = `cd projects/rag-2-games-lib/ && npx ng g c ${CLI_TARGET_PATH}/${gameName} --skip-tests`;

  console.log(`Running command: ${command}`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Component created successfully:\n${stdout}`);

    fs.mkdir(modelsPath, { recursive: true }, err => {
      if (err) {
        console.error(`Failed to create 'models' folder: ${err.message}`);
        return;
      }

      const classFileContent = `
import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class ${stateClassName} implements TGameState {
    // to implement
}

export class ${gameClassName} extends Game {
    public override name = '${gameName.toLowerCase()}';
    public override state = new ${stateClassName}();

    public override outputSpec = \`\`;
    public override players = [
        //to implement
        //new Player()
    ];
}
      `.trim();

      fs.writeFile(classFilePath, classFileContent, err => {
        if (err) {
          console.error(`Failed to create class file: ${err.message}`);
          return;
        }
        console.log(`Class file created: ${classFilePath}`);
      });
    });

    const componentFileContent = getComponentFileContent(
      gameName,
      stateClassName,
      gameClassName
    );

    fs.writeFile(componentFilePath, componentFileContent, err => {
      if (err) {
        console.error(`Failed to create component file: ${err.message}`);
        return;
      }
      console.log(`Component file created: ${componentFilePath}`);
    });

    updateGamesTs(gameName);
  });

  updateGameLibComponent(gameName);
}

function updateGamesTs(gameName) {
  let gamesTsContent = fs.readFileSync(GAMES_TS_PATH, 'utf-8');

  const newGameImport = `import { ${capitalize(gameName)} } from '../games/${gameName.toLowerCase()}/models/${gameName.toLowerCase()}.class';\n`;

  if (!gamesTsContent.includes(newGameImport)) {
    const importSectionEnd = gamesTsContent.indexOf('export const games:');

    if (importSectionEnd !== -1) {
      gamesTsContent =
        gamesTsContent.slice(0, importSectionEnd) +
        newGameImport +
        gamesTsContent.slice(importSectionEnd);
    } else {
      gamesTsContent = newGameImport + gamesTsContent;
    }

    fs.writeFileSync(GAMES_TS_PATH, gamesTsContent, 'utf-8');
    console.log(`Added import for ${gameName} to games.ts`);
  } else {
    console.log(`Import for ${gameName} already exists in games.ts`);
  }

  const newGameEntry = `  ${gameName.toLowerCase()}: new ${capitalize(gameName)}(),\n`;

  const objectEnd = gamesTsContent.lastIndexOf('};');
  const updatedGamesTs =
    gamesTsContent.substring(0, objectEnd) +
    newGameEntry +
    gamesTsContent.substring(objectEnd);

  fs.writeFileSync(GAMES_TS_PATH, updatedGamesTs, 'utf-8');
  console.log(`Added ${gameName} game to the games object in games.ts`);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getComponentFileContent(gameName, stateClassName, gameClassName) {
  return `
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { ${gameClassName}, ${stateClassName} } from './models/${gameName.toLowerCase()}.class';

@Component({
  selector: 'app-${gameName.toLowerCase()}',
  standalone: true,
  imports: [CanvasComponent],
  template: \`
    <app-canvas
      [displayMode]="'horizontal'"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> \`,
})
export class ${gameClassName}GameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: ${gameClassName};

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as ${gameClassName};
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.render();
  }

  public override restart(): void {
    this.game.state = new ${stateClassName}();
  }

  protected override update(): void {
    super.update();
    this.render();
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
      // Render view here
    }
  }

  //
}
  `.trim();
}

function updateGameLibComponent(gameName) {
  let gameLibComponent = fs.readFileSync(RAG_2_GAMES_LIB_PATH, 'utf-8');

  const newGameImport = `import { ${capitalize(gameName)}GameWindowComponent } from './games/${gameName.toLowerCase()}/${gameName.toLowerCase()}.component';\n`;

  if (!gameLibComponent.includes(newGameImport)) {
    const componentIndex = gameLibComponent.indexOf('@Component({');

    if (componentIndex !== -1) {
      const componentLineStart = gameLibComponent.lastIndexOf(
        '\n',
        componentIndex
      );

      const insertPosition =
        gameLibComponent.lastIndexOf('\n', componentLineStart - 1) + 1;

      gameLibComponent =
        gameLibComponent.slice(0, insertPosition) +
        newGameImport +
        gameLibComponent.slice(insertPosition);
    } else {
      gameLibComponent = newGameImport + gameLibComponent;
    }
  }

  const newImportsSection = `\t${capitalize(gameName)}GameWindowComponent`;
  const importsSectionEnd = gameLibComponent.indexOf('],');

  if (importsSectionEnd !== -1) {
    gameLibComponent =
      gameLibComponent.slice(0, importsSectionEnd) +
      newImportsSection +
      gameLibComponent.slice(importsSectionEnd);
  } else {
    gameLibComponent = newImportsSection + gameLibComponent;
  }

  const caseRegex = /@case/g;
  let match;
  let lastCaseIndex = -1;

  while ((match = caseRegex.exec(gameLibComponent)) !== null) {
    lastCaseIndex = match.index;
  }

  if (lastCaseIndex !== -1) {
    let lines = gameLibComponent.split('\n');

    const lastCaseLine =
      gameLibComponent.slice(0, lastCaseIndex).split('\n').length - 1;

    const insertLine = lastCaseLine + 9;
    lines.splice(
      insertLine,
      0,
      `\t\t\t@case ('${gameName.toLowerCase()}') {
        <app-${gameName.toLowerCase()}
          class="flex flex-col items-center w-3/4"
          [gameRestart]="gameRestart"
          [gamePause]="gamePause"
          [setAbstractGame]="game"
          [setSocketInputDataReceive]="socketInputData"
          (gameStateDataEmitter)="handleGameStateData($event)" />
      }`
    );

    gameLibComponent = lines.join('\n');
  }

  fs.writeFileSync(RAG_2_GAMES_LIB_PATH, gameLibComponent, 'utf-8');
  console.log(
    `Updated rag-2-games-lib.component.ts with ${gameName} game data.`
  );
}

const gameName = process.argv[2];
generateGameFiles(gameName.toLowerCase());
