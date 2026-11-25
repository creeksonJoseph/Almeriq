# Architecture documentation

> Implementation references: [Documentation source map](docs/SOURCE_OF_TRUTH.md).

This file previously described only an early founder AI-analysis workflow and was not a complete description of the platform.

The current, source-reviewed platform architecture is maintained in [docs/SYSTEM_ARCHITECTURE.md](docs/SYSTEM_ARCHITECTURE.md).

For the developer handover, start at [docs/DEVELOPER_HANDOVER.md](docs/DEVELOPER_HANDOVER.md). For the detailed founder AI workflow, inspect the current implementation in:
- frontend/src/Pages/founder/
- frontend/src/hooks/useFounderFlow.js
- server/api/routers/founder.py
- server/services/founder.py
- server/services/founder_prompts.py
- server/core/gemini.py

Do not treat old prompt examples, table definitions, timing values or logging examples from the previous version of this file as current contracts without checking source.
