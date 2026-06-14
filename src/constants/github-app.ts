export const PR_TITLE = 'Add Klaude Code GitHub Workflow'

export const GITHUB_ACTION_SETUP_DOCS_URL =
  'https://github.com/anthropics/klaude-code-action/blob/main/docs/setup.md'

export const WORKFLOW_CONTENT = `name: Klaude Code

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]

jobs:
  klaude:
    if: |
      (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@klaude')) ||
      (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@klaude')) ||
      (github.event_name == 'pull_request_review' && contains(github.event.review.body, '@klaude')) ||
      (github.event_name == 'issues' && (contains(github.event.issue.body, '@klaude') || contains(github.event.issue.title, '@klaude')))
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write
      actions: read # Required for Klaude to read CI results on PRs
    steps:
      - name: Checkout repository
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2, 2026-04-25
        with:
          fetch-depth: 1

      - name: Run Klaude Code
        id: klaude
        uses: anthropics/klaude-code-action@567fe954a4527e81f132d87d1bdbcc94f7737434 # v1, 2026-04-25
        with:
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}

          # This is an optional setting that allows Klaude to read CI results on PRs
          additional_permissions: |
            actions: read

          # Optional: Give a custom prompt to Klaude. If this is not specified, Klaude will perform the instructions specified in the comment that tagged it.
          # prompt: 'Update the pull request description to include a summary of changes.'

          # Optional: Add klaude_args to customize behavior and configuration
          # See https://github.com/anthropics/klaude-code-action/blob/main/docs/usage.md
          # or https://code.klaude.com/docs/en/cli-reference for available options
          # klaude_args: '--allowed-tools Bash(gh pr:*)'

`

export const PR_BODY = `## 🤖 Installing Klaude Code GitHub App

This PR adds a GitHub Actions workflow that enables Klaude Code integration in our repository.

### What is Klaude Code?

[Klaude Code](https://klaude.com/klaude-code) is an AI coding agent that can help with:
- Bug fixes and improvements  
- Documentation updates
- Implementing new features
- Code reviews and suggestions
- Writing tests
- And more!

### How it works

Once this PR is merged, we'll be able to interact with Klaude by mentioning @klaude in a pull request or issue comment.
Once the workflow is triggered, Klaude will analyze the comment and surrounding context, and execute on the request in a GitHub action.

### Important Notes

- **This workflow won't take effect until this PR is merged**
- **@klaude mentions won't work until after the merge is complete**
- The workflow runs automatically whenever Klaude is mentioned in PR or issue comments
- Klaude gets access to the entire PR or issue context including files, diffs, and previous comments

### Security

- Our Anthropic API key is securely stored as a GitHub Actions secret
- Only users with write access to the repository can trigger the workflow
- All Klaude runs are stored in the GitHub Actions run history
- Klaude's default tools are limited to reading/writing files and interacting with our repo by creating comments, branches, and commits.
- We can add more allowed tools by adding them to the workflow file like:

\`\`\`
allowed_tools: Bash(npm install),Bash(npm run build),Bash(npm run lint),Bash(npm run test)
\`\`\`

There's more information in the [Klaude Code action repo](https://github.com/anthropics/klaude-code-action).

After merging this PR, let's try mentioning @klaude in a comment on any PR to get started!`

export const CODE_REVIEW_PLUGIN_WORKFLOW_CONTENT = `name: Klaude Code Review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]
    # Optional: Only run on specific file changes
    # paths:
    #   - "src/**/*.ts"
    #   - "src/**/*.tsx"
    #   - "src/**/*.js"
    #   - "src/**/*.jsx"

jobs:
  klaude-review:
    # Optional: Filter by PR author
    # if: |
    #   github.event.pull_request.user.login == 'external-contributor' ||
    #   github.event.pull_request.user.login == 'new-developer' ||
    #   github.event.pull_request.author_association == 'FIRST_TIME_CONTRIBUTOR'

    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2, 2026-04-25
        with:
          fetch-depth: 1

      - name: Run Klaude Code Review
        id: klaude-review
        uses: anthropics/klaude-code-action@567fe954a4527e81f132d87d1bdbcc94f7737434 # v1, 2026-04-25
        with:
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
          plugin_marketplaces: 'https://github.com/anthropics/klaude-code.git'
          plugins: 'code-review@klaude-code-plugins'
          prompt: '/code-review:code-review \${{ github.repository }}/pull/\${{ github.event.pull_request.number }}'
          # See https://github.com/anthropics/klaude-code-action/blob/main/docs/usage.md
          # or https://code.klaude.com/docs/en/cli-reference for available options

`
