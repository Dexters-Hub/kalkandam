# Font info archive

`data/font-info.json` holds reviewed facts about fonts and the people behind them. The site reads it at runtime.

```json
{
  "people": {
    "Designer Name": { "link": "https://example.com", "about": "One line about them." }
  },
  "fonts": {
    "Family (Collection)": {
      "designer": "Designer Name",
      "year": "1998",
      "foundry": "Publisher",
      "story": "A short story.",
      "source": "https://example.com/proof",
      "addedBy": ["Contributor name"],
      "issues": [12]
    }
  }
}
```

- Font keys match the names in the contribute form, e.g. `Karthika (ML-TT)`.
- A font's `designer` shows in its sheet and gives the designer a profile on `/about`.
- `people` entries add a link and one line to a profile. Only add what the person has made public.

## Accepting a contribution

1. Check the issue (label `font-info`) and its source.
2. Run `node scripts/add_font_info.mjs <issue-number>`. It needs the `gh` CLI.
3. Edit the entry down to the fact, e.g. `"designer": "Name"`, and commit.
4. Close the issue with a thank-you.
