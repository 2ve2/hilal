export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'test',
        'docs',
        'refactor',
        'perf',
        'chore',
        'ci',
        'build',
        'style',
      ],
    ],
    'scope-enum': [
      2,
      'always',
      ['core', 'calendar', 'theme', 'example', 'docs', 'ci', 'scripts'],
    ],
    'header-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 72],
  },
};
