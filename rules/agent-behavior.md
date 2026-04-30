# Usage Rules for Agents

When an AI agent uses the `erp-master-agent` skills, they should:

1. Look in the installed skills directory (e.g., `.agents/skills`, `.claude/skills`, `.cursor/skills`, `.github/skills`, or `.windsurf/skills` — depending on your IDE) for domain-specific ERP marketplace knowledge.
2. Read the `SKILL.md` file *before* executing any modifications to the repository, especially related to API payload mapping for Walmart, TikTok, Amazon, and MercadoLibre.
3. Keep tokens in mind. If you are writing boilerplate, compress output when possible or explicitly call out what you are skipping.
4. **Skill Auditor Restrictions**: The `skill-auditor` agent (or any agent modifying skills) must *never* autonomously rewrite or modify a user's skills. Always require explicit user confirmation before editing or updating skill documents regarding their code.