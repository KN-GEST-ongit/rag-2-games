# RAG-2-GAMES

## GETTING STARTED

### GET THE CORRECT VERSION OF NODE

The first thing you need to do is ensure that you have the correct version of **Node.js** installed. This repository requires **Node v20.18.0**. If you have a different version installed, you can use `NVM` (Node Version Manager) to manage multiple versions of Node. If you need assistance, feel free to ask one of the codeowners for help.

### HOW TO START THE APP AND LIBRARY

To start working with this repository:

- Clone the repository and navigate into the project directory.

```
git clone https://github.com/KN-GEST-ongit/rag-2-games.git

cd rag-2-games
```

- Install all dependencies.

```
npm install
```

- Start the development server.

```
npm start
```

This project uses Angular CLI (installed locally via `devDependencies`). You **do not need to install it globally**.

To run Angular CLI commands, always use `npx` before it.

### SET UP YOUR IDE

You should also configure **Prettier** and **ESLint** in your IDE to ensure consistent code formatting and style across all developers.

If you are using **VSCode** (most recommended) install the following extensions:

- Prettier - Code formatter
- Prettier ESLint
- ESLint

Additionally, ensure that the `Format on Save` option is enabled in your VSCode settings:

- Open setting by clicking CTRL + ,
- Search for `Format on save`
- Ensure that the option `Editor: Format on save` is checked

## WORKING WITH THIS PROJECT

### MAIN INFO

This is a preview (demo) version of the main frontend app. It contains only elements that are useful for the game development process.

### FILES INFO

All changes should be made in the `/projects/rag-2-games-lib/`. Do **not** create any new files in the main `src/` directory.

Remember to export all components/models that need to be **accessible** in the main app by adding them to `public-api.ts`.

### ADDING NEW DEPENDENCIES

If you need to add a new package from npm to the library, add it to the `peerDependencies` section of **library's** `package.json`.

### GAME CREATING SCRIPT

A script has already been created to help you start working on a new game. Please refer to the provided manual or the existing README [file](./scripts/README.md) for detailed instructions on how to use the scripts.

### BUILDING AND EXPORTING LIBRARY

To build and export the library, we have created some helpful aliases for you to **use**.

For building library, run:

```
npm run games:build
```

If there are no errors, the build will be completed.

After building, you have two options for exporting the library:

- Pack it ino `.tgz` file using:

```
npm run games:pack
```

- Link it to npm locally with:

```
npm run games:link
```

If everything goes well, the library will be ready to be used in the main frontend app.

## PROJECT CONTRIBUTION GUIDELINES

### STARTING A NEW TASK

Before starting a new task, make sure you’ve completed the following steps:

- Create an issue in this repository with a clear and descriptive title in English.
- Add yourself to the `Assignees` of issue.
- Create a new branch from **dev** branch. Name the branch using the format `issue-1` (if the issue number is 1).
- Checkout to your newly created branch and start working on your task.

### MAKING COMMITS

As you make progress, commit your changes to your branch. Make sure to use the correct commit message format. Use one of the following prefixes:

- **feat** - for adding some new functionality
- **fix** - for fixing bugs or broken functionality
- **refactor** - for changes to existing code that improve structure without changing behavior

Your commit message should include the issue number and a short description of the change (in English).

Examples of correctly formatted commit messages:

- _feat: #4 added view of new game_
- _fix: #17 fixed mapping function_
- _refactor: #22 changed way of getting some game props_

### CREATING A PULL REQUESTS

Once you’ve completed your task, open a pull request from your branch to the **dev** branch. Make sure to:

- Add yourself to the `Assignees` section of the pull request
- Request a review from one of the repository code owners

Then wait for your changes to be reviewed and either merged into the dev branch or for feedback requesting changes.

**Important**: Before creating a pull request, **make sure** that all functionalities are working properly. **Test** your changes thoroughly before submitting the PR.
