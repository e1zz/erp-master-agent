# ERP Master Agent Coding Rules

When contributing to this workspace or using the skills, please adhere to the following rules:

1. **Idempotency**: All skills and installation scripts must be idempotent. Running them multiple times should not corrupt the target directory or create duplicate entries.
2. **No Interactive Prompts**: Do not write scripts that require interactive `stdin` input unless explicitly bypassed with a `--force` or `--yes` flag. The installer must run headlessly.
3. **Cross-Platform Compatibility**: Use `path.join` and `path.resolve` in all Node.js scripts instead of hardcoding slashes to ensure it works on Windows, macOS, and Linux.
4. **Agent File Formats**: Maintain `.md` format for all skill and rule definitions so they remain easily readable by both LLMs and humans.