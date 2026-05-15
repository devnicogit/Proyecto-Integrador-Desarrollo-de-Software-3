# APKs pre-compilados de EcoRoute Driver

Sirven para instalar la app móvil en una PC sin tener que instalar Flutter SDK.

## Cuándo se usan

Si `run_pipeline.py` detecta que Flutter no está en PATH y la app no está aún
instalada en el AVD, automáticamente hace `adb install` del APK apropiado
según la arquitectura del emulador detectada con `adb shell getprop ro.product.cpu.abi`.

## Archivos

- `app-debug-x86_64.apk` — para AVDs corriendo en PC con CPU Intel/AMD
  (Pixel 9 Pro XL, Pixel 6 Pro, Medium_Phone_API_36, etc. en Windows/macOS/Linux
  x86_64). **Único versionado** (cabe en límite 100 MB de GitHub). Es el caso de
  uso del pipeline (AVD corriendo en PC).

- ~~`app-debug-arm64-v8a.apk`~~ — NO versionado (supera 100 MB). Para
  dispositivos físicos Android o AVDs en Apple Silicon (M1/M2/M3),
  compilalo localmente con el comando de abajo.

## Si querés re-generarlos

```powershell
cd mobile-app
flutter pub get
flutter build apk --debug --split-per-abi
copy build\app\outputs\flutter-apk\app-x86_64-debug.apk   prebuilt\app-debug-x86_64.apk
copy build\app\outputs\flutter-apk\app-arm64-v8a-debug.apk prebuilt\app-debug-arm64-v8a.apk
```

## Versión

Estos APKs apuntan al backend en `http://10.0.2.2:8081` (alias del host desde
dentro del emulador). Si cambiás la URL del backend en
`mobile-app/lib/core/config/api_config.dart`, hay que recompilar.
