import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/di/injection_container.dart' as di;
import 'core/theme/app_theme.dart';
import 'features/gps/presentation/bloc/gps_bloc.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'features/auth/presentation/bloc/auth_event.dart';
import 'features/auth/presentation/pages/login_page.dart';
import 'features/routes/presentation/bloc/route_bloc.dart';
import 'features/orders/presentation/bloc/order_bloc.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inicializamos la inyección de dependencias (GetIt)
  await di.init();

  runApp(const EcoRouteApp());
}

class EcoRouteApp extends StatelessWidget {
  const EcoRouteApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider(
          create: (_) => di.sl<AuthBloc>()..add(CheckAuthStatusEvent()),
        ),
        BlocProvider(
          create: (_) => di.sl<GpsBloc>(),
        ),
        BlocProvider(
          create: (_) => di.sl<RouteBloc>(),
        ),
        BlocProvider(
          create: (_) => di.sl<OrderBloc>(),
        ),
      ],
      child: MaterialApp(
        title: 'EcoRoute Driver',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        // Por ahora cargamos directamente el Login,
        // cuando agreguemos GoRouter manejaremos las redirecciones.
        home: const LoginPage(),
      ),
    );
  }
}
