# EcoRoute - Driver App (Flutter)

Este proyecto corresponde a la aplicación móvil para conductores del sistema **EcoRoute**, construida con Flutter bajo principios de Clean Architecture y SOLID.

## 🏗 Arquitectura

El proyecto sigue **Clean Architecture** estructurado en las siguientes capas por cada "Feature" (ej. `auth`, `orders`, `gps`):

1.  **Domain:** Entidades (`entities`), Contratos (`repositories`), Casos de Uso (`usecases`). ¡Cero dependencias de UI o APIs externas! Puro Dart.
2.  **Data:** Modelos (`models`), Repositorios concretos (`repositories`), Fuentes de datos (`datasources` - local y remote).
3.  **Presentation:** Estados y lógica (`bloc` o `cubit`), Interfaz de usuario (`pages`, `widgets`).
4.  **Core:** Utilidades, inyección de dependencias (`get_it`), temas (`theme`), manejo de errores (`error`).

## 📦 Stack Tecnológico

-   **State Management:** `flutter_bloc`
-   **Dependency Injection:** `get_it`
-   **Networking:** `dio`
-   **Programación Funcional (Manejo de Errores):** `dartz` (Either, Left, Right)
-   **Local Storage & Offline First:** `isar` (Base de datos NoSQL muy rápida para Flutter) + `flutter_secure_storage` (Tokens JWT).
-   **Routing:** `go_router`

## 🚀 Cómo Empezar

1.  Asegúrate de tener Flutter SDK instalado (`flutter doctor`).
2.  Posiciónate en esta carpeta `mobile-app/`.
3.  Ejecuta `flutter create .` para generar las carpetas nativas (`android/`, `ios/`) sin perder nuestra estructura base.
4.  Ejecuta `flutter pub get` para descargar dependencias.
5.  Corre el proyecto: `flutter run`.
