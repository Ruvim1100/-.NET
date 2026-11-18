# Матрица версий · 18 ноября 2026

|Ветка|GA|SDK / TFM|Язык по умолчанию|Runtime / ASP.NET Core|EF Core|Поддержка до|
|---|---|---|---|---|---|---|
|11 STS · основная|10.11.2026|11.0.100 / net11.0|C# 15|11.0.0|11.0.0, требует net11.0|14.11.2028|
|10 LTS · сравнение|11.11.2025|10.0.x / net10.0|C# 14|ветка 10, runtime 10.0.15|10.x|14.11.2028|

Для новых лабораторных выбираем стабильный SDK 11. Файл global.json управляет выбором инструментов, TargetFramework определяет цель проекта. Номер SDK и номер runtime различаются. Поддержка требует своевременных patch-обновлений. Пример EF Core 11 требует совместимого провайдера PostgreSQL, его версию проверить отдельно перед M14.

C# 15 добавляет union types и closed hierarchies. Memory safety остаётся preview и исключена из обязательных примеров. При миграции проверить требования CPU, поведенческие изменения runtime и права на каталог артефактов VSTest в контейнере. Для каждого изменения выбрать проверку: сборка исходников, запуск прежнего бинарника или сравнение наблюдаемого поведения.

Источники: [поддержка](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core), [состав SDK](https://dotnet.microsoft.com/en-us/download/dotnet/11.0), [C# 15](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-15), [EF11 на NuGet](https://www.nuget.org/packages/Microsoft.EntityFrameworkCore/11.0.0), [совместимость](https://learn.microsoft.com/en-us/dotnet/core/compatibility/11).
