# Branches and deploys (Guacuco)

| Branch | Stage | Deploys to |
|---|---|---|
| `master` | Production | Vercel production, then guacuco.makaybeachclub.com is re-pointed at the new build |
| `main` | Staging | Vercel preview; the URL is in the Deploy run summary on GitHub Actions |
| anything else | Work in progress | Vercel preview from Vercel's Git integration (one per pull request) |

Flow: open pull requests into `main`, check them on staging, then merge `main` into `master` to release.

`.github/workflows/deploy.yml` does the `master` and `main` deploys. Vercel's own Git deploys are off for those two branches (`git.deploymentEnabled` in `vercel.json`), so the Vercel dashboard's production branch setting does not decide what goes live.

If something looks out of date:
1. Check the latest Deploy run under the repository's Actions tab. A red run says why, for example a missing `VERCEL_TOKEN` secret.
2. To redeploy without a new commit, use "Run workflow" on the Deploy workflow and pick `master`. Do not use Vercel's "Redeploy" button: it rebuilds the old commit.
