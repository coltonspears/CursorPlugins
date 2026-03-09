---
name: wpf-patterns
description: Guide WPF development using MVVM patterns, data binding best practices, and team conventions. Use when working in WPF/XAML projects.
profiles: [wpf]
---

# WPF patterns

## Trigger

The user is working on WPF/XAML code — creating views, view models, or data bindings.

## Workflow

1. Identify whether the task involves a View (.xaml), ViewModel (.cs), Model, or Service.
2. Apply MVVM separation:
   - Views contain only layout and binding markup — no business logic.
   - ViewModels expose properties via INotifyPropertyChanged and commands via ICommand / RelayCommand.
   - Models are plain data objects with no UI dependencies.
3. For data binding:
   - Use `{Binding}` with explicit `Mode` (OneWay, TwoWay) and `UpdateSourceTrigger` where applicable.
   - Prefer compiled bindings (`x:Bind`) when targeting UWP/WinUI; standard `{Binding}` for WPF.
   - Validate with `IDataErrorInfo` or `INotifyDataErrorInfo`.
4. For navigation and dialogs, use a service abstraction — never reference `Window` or `MessageBox` from a ViewModel.

## Guardrails

- No code-behind logic in `.xaml.cs` beyond `InitializeComponent()` and navigation wiring.
- ViewModels must be testable without a UI thread.
- Use `ObservableCollection<T>` for list bindings, not `List<T>`.
- Resource dictionaries for shared styles — do not inline styles repeatedly.
