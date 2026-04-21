# certifieddata-synthetic-templates

Public, forkable **template definitions** for the CertifiedData synthetic dataset generator. Every template here maps 1:1 to a runnable scenario on [certifieddata.io/generate](https://certifieddata.io/generate). Fork this repo to propose new templates or adapt existing ones for your own workloads.

> Dataset Generation is one of three CertifiedData pillars. Each generated dataset ships with an Ed25519-signed certificate proving when, how, and from what template it was produced. Verification uses the same signing root as the Decision Ledger and Agent Commerce receipts.

## What's here

```
.
├── schema/
│   └── template.schema.json       # JSON Schema (Draft 2020-12) for a template
├── templates/
│   ├── fraud/                     # Fraud detection (highest-signal demo)
│   ├── healthcare/                # Healthcare claims + outcomes
│   ├── hr/                        # HR / workforce analytics
│   └── finance/                   # Retail banking / lending features
└── scripts/
    └── validate.mjs               # Validate every template against the schema
```

## Template shape

A template is a JSON file describing:

* `id` — stable slug used by the generator
* `name` / `description` — human-readable labels
* `domain` — one of `finance`, `healthcare`, `fraud`, `hr`, `retail`, `telecom`, `insurance`, `other`
* `algorithm` — e.g. `CTGAN`, with configuration (`epochs`, `batch_size`, `embedding_dim`)
* `columns` — ordered list of column specs (name, type, distribution, constraints, PII class)
* `target_rows_default` — default row count for the generator slider
* `target_rows_max_anonymous` / `target_rows_max_free` — limits the generator UI respects
* `tags` — searchable keywords
* `version` — semver; certificates record the version at generation time

See [`schema/template.schema.json`](./schema/template.schema.json) for the authoritative contract.

## Quickstart

```bash
# Validate every template against the schema
node scripts/validate.mjs

# Add a new template
cp -r templates/fraud templates/my-new-template
# … edit metadata and columns …
node scripts/validate.mjs templates/my-new-template
```

## Contributing a new template

1. Fork the repo and create a new folder under `templates/<your-slug>/`.
2. Include `template.json` (required) and optionally `columns.json` (broken out for readability).
3. Run `node scripts/validate.mjs` — CI will run the same check on every PR.
4. Open a PR. Approved templates are imported into the CertifiedData generator and become available at `/generate?template=<your-slug>`.

## Limits & certification

The generator's current anonymous limits (enforced on the CertifiedData API):

| Tier | Generations | Rows per generation |
|---|---|---|
| Anonymous | 10 per 24h per IP | up to 1,000 |
| Free account | 5 jobs per month | up to 10,000 |

Every generation produces a certificate with:
* dataset SHA-256 hash (over the exported CSV bytes)
* template `id` + `version`
* algorithm + parameters at generation time
* Ed25519 signature and key ID

Verify any certificate at [certifieddata.io/verify](https://certifieddata.io/verify).

## License

MIT — see [LICENSE](./LICENSE).
