# Contributing

Contributions are welcome, from typo fixes to new features. Please read the [code of conduct](CODE_OF_CONDUCT.md) first.

For anything bigger than a small fix, open an issue to discuss it before writing code. Ideas already planned are listed in the [roadmap](README.md#roadmap).

## Setup

The repository is a Yarn workspace with two packages:

- the library, in the root directory
- an Expo example app, in [`example/`](example), which uses the library's source directly

Use the Node.js version in [`.nvmrc`](.nvmrc). It must be an official build with full ICU, which the default downloads from nodejs.org are. The tests compare the library with ICU's Umm al-Qura calendar.

```sh
git clone https://github.com/2ve2/hilal.git
cd hilal
corepack enable   # or run node .yarn/releases/yarn-*.cjs in place of yarn
yarn
```

Yarn is pinned in the repository, so npm is not used for development.

## Commands

| Command                  | What it does                                               |
| ------------------------ | ---------------------------------------------------------- |
| `yarn test`              | Unit and component tests (Jest)                            |
| `yarn typecheck`         | TypeScript                                                 |
| `yarn lint`              | ESLint and Prettier (`yarn lint --fix` to fix)             |
| `yarn prepare`           | Build the library into `lib/`                              |
| `yarn example start`     | Start the example app (Expo Go, simulator, or `w` for web) |
| `yarn generate:umalqura` | Regenerate `src/core/umalqura-data.ts` from Node's ICU     |

Changes to `src/` show up in the running example app right away.

## Project structure

```
src/
  core/        Conversion and formatting, no React (public API)
  calendar/    The <HilalCalendar /> component, its model and themes
scripts/       Generator for the Umm al-Qura table
example/       Expo example app
```

## Tests

- **Every day is checked against ICU.** `src/core/__tests__/icu-cross-check.test.ts` compares the library with Node's `islamic-umalqura` calendar for every day from 1937 to 2077. If it fails, the table or the conversion is wrong. Don't edit `umalqura-data.ts` by hand: it is generated.
- **The suite runs at UTC+14** (`jest.global-setup.js`), so code that takes a calendar day from a UTC timestamp fails. Work with local calendar days (year, month, day), never `toISOString()` or `getUTC*`.
- **Component tests** use [React Native Testing Library](https://callstack.github.io/react-native-testing-library/). Query by role and accessible name, the way a screen reader sees the calendar.

Add tests with every change. A bug fix should come with a test that fails without it.

## Commits

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/), and a `commit-msg` hook checks them:

```
type(scope): short summary in the imperative, lowercase, no period
```

- **Types:** `feat`, `fix`, `test`, `docs`, `refactor`, `perf`, `chore`, `ci`, `build`, `style`
- **Scopes (optional):** `core`, `calendar`, `theme`, `example`, `docs`, `ci`, `scripts`
- Keep the summary under 72 characters. Add a body when the reason for the change isn't obvious.
- Make one logical change per commit, and make sure every commit passes lint, typecheck and tests.

The changelog is generated from these messages, so they are worth getting right.

A `pre-commit` hook runs ESLint and Prettier on the staged files.

## Pull requests

1. Branch from `main`, for example `feat/range-selection` or `fix/rtl-arrows`.
2. Keep the pull request focused on one change, small enough to review in about 15 minutes.
3. Fill in the [pull request template](.github/pull_request_template.md). Add screenshots or a GIF for any UI change.
4. CI runs lint, typecheck, tests and the builds. All of it must pass.

Pull requests are merged with a merge commit or a rebase, never squashed, so the individual commits stay in the history.

## Releases

Releases are made by the maintainer, in two steps, because `main` only changes through pull requests.

1. **Prepare**, on a `release/*` branch from `main`:

   ```sh
   git switch -c release/v0.2.0 origin/main
   yarn release
   ```

   [release-it](https://github.com/release-it/release-it) runs lint, typecheck and the tests, bumps the version, writes `CHANGELOG.md` from the commit messages, commits `chore: release x.y.z` and pushes the branch. Open a pull request for it and merge it.

2. **Publish**, from `main` after the merge: tag the merge commit `vX.Y.Z`, push the tag, run `npm publish`, and create the GitHub release from the new `CHANGELOG.md` section.
