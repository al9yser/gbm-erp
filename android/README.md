# GBM ERP — Native Android

Kotlin + Jetpack Compose + Material 3 with Room/SQLite local persistence. The native app contains dashboard, inventory, counterparties, invoices, quotations, reports, settings, PDF sharing and JSON snapshot import.

## Existing-data migration
The uploaded APK contains `assets/flutter_assets/assets/data/source_snapshot.json`. Extract that JSON and use Settings → Import data to migrate products, contacts, invoices, invoice lines and settings. The business dataset is deliberately not committed to this public repository.

## Build
Open this `android` directory in Android Studio. With Gradle 8.9 and JDK 17:
```bash
gradle :app:assembleDebug
gradle :app:testDebugUnitTest
```
GitHub Actions runs build, unit tests and Android Emulator instrumentation tests, then uploads the Debug APK artifact only after checks pass.
