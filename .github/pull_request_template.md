## Steel fold

### Primary strengthened

- [ ] Upload
- [ ] Scroll
- [ ] Vote
- [ ] History
- [ ] Museum

Explain the measurable improvement:

## Scope

What working behavior is preserved?

What is the smallest new capability or repair?

## Anti-vibe-code gates

- [ ] Secret scan passed; no private key, credential, signed private URL, private record, or proprietary threshold is exposed.
- [ ] Authorization was reviewed; authentication is not being mistaken for permission.
- [ ] Public inputs have server/database-enforced validation, quotas, or abuse controls where applicable.
- [ ] Dependencies are necessary, real, maintained, and lockfile changes were reviewed.
- [ ] Changed UI includes loading, success, empty, error, and disabled states where applicable.
- [ ] Critical actions are reachable on mobile and by keyboard.
- [ ] Feed/media/database operations remain bounded and paginated where applicable.
- [ ] Security-sensitive logic has a named and auditable boundary.
- [ ] Activation and rollback are documented.

## Executable proof

```txt
Secret scan: PASS / FAIL
Authorization tests: PASS / FAIL / N-A
Input and abuse controls: PASS / FAIL / N-A
Dependency review: PASS / FAIL / N-A
Typecheck: PASS / FAIL
Build: PASS / FAIL
Bundle impact: improved / neutral / justified regression
Mobile verification: PASS / FAIL / pending
Production verification: PASS / FAIL / pending
Rollback defined: YES / NO
```

Commands and results:

```bash
# paste exact commands
```

## Production verification card

Device/browser:

Account role:

Exact path tested:

Expected result:

Observed result:

Evidence location:

## Bug metabolism

When this PR repairs a defect, what durable protection remains?

- [ ] Regression test
- [ ] Stronger policy or invariant
- [ ] Better error state
- [ ] Simplified architecture
- [ ] Monitoring signal
- [ ] Documentation or rollback improvement
- [ ] Not a bug repair

## Security boundary

List any secrets, private data, administrative operations, or proprietary algorithm details deliberately excluded from this PR.
