#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../.."

npm ci

npx vitest run \
  --coverage \
  --coverage.reporter=text \
  --coverage.reporter=json-summary \
  --coverage.reporter=lcov