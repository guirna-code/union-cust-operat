# Electoral programme download

`programme-electoral-uc.pdf` is generated from the Arabic source of truth at
`chat.md` so the website download never drifts from the published programme.

Regenerate it after editing `chat.md`:

```powershell
.\scripts\generate-program-pdf.ps1
```
