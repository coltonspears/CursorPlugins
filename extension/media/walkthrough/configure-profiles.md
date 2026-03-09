## Map Repos to Profiles

Open settings and configure `cursorTeamTools.repoProfiles` to map your repository folder names to profile names.

### Example

```json
{
  "WPFApp": "wpf",
  "WPFAdmin": "wpf",
  "SqlServerDB": "sql"
}
```

This tells the extension that `WPFApp` and `WPFAdmin` should get **wpf** skills and rules, while `SqlServerDB` gets **sql** skills and rules. Common assets are always included.
