import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/di/injection_container.dart' as di;
import 'core/theme/app_theme.dart';
import 'core/theme/theme_bloc.dart';
import 'core/router/app_router.dart';
import 'features/gps/presentation/bloc/gps_bloc.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
import 'features/routes/presentation/bloc/route_bloc.dart';
import 'features/orders/presentation/bloc/order_bloc.dart';
import 'features/history/presentation/bloc/history_bloc.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inicializamos la inyeccion de dependencias (GetIt)
  await di.init();

  runApp(const EcoRouteApp());
}

class EcoRouteApp extends StatelessWidget {
  const EcoRouteApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authBloc = di.sl<AuthBloc>()..add(CheckAuthStatusEvent());

    return MultiBlocProvider(
      providers: [
        BlocProvider(create: (_) => authBloc),
        BlocProvider(create: (_) => di.sl<ThemeBloc>()),
        BlocProvider(create: (_) => di.sl<GpsBloc>()),
        BlocProvider(create: (_) => di.sl<RouteBloc>()),
        BlocProvider(create: (_) => di.sl<OrderBloc>()),
        BlocProvider(create: (_) => di.sl<HistoryBloc>()),
      ],
      child: BlocBuilder<ThemeBloc, ThemeState>(
        builder: (context, themeState) {
          final router = createAppRouter(authBloc);
          return MaterialApp.router(
            title: 'EcoRoute Driver',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.lightTheme,
            darkTheme: AppTheme.darkTheme,
            themeMode: themeState.themeMode,
            routerConfig: router,
          );
        },
      ),
    );
  }
}
