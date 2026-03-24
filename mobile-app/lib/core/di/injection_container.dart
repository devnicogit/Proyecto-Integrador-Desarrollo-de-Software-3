import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../network/auth_interceptor.dart';
import '../../features/auth/data/datasources/auth_local_data_source.dart';
import '../../features/auth/data/datasources/auth_remote_data_source.dart';
import '../../features/auth/data/repositories/auth_repository_impl.dart';
import '../../features/auth/domain/repositories/auth_repository.dart';
import '../../features/auth/domain/usecases/login_usecase.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';

import '../../features/gps/data/datasources/gps_sensor_data_source.dart';
import '../../features/gps/data/repositories/gps_repository_impl.dart';
import '../../features/gps/domain/repositories/gps_repository.dart';
import '../../features/gps/presentation/bloc/gps_bloc.dart';

import '../../features/routes/data/datasources/route_remote_data_source.dart';
import '../../features/routes/data/repositories/route_repository_impl.dart';
import '../../features/routes/domain/repositories/route_repository.dart';
import '../../features/routes/domain/usecases/get_driver_routes.dart';
import '../../features/routes/presentation/bloc/route_bloc.dart';

import '../../features/orders/data/datasources/order_remote_data_source.dart';
import '../../features/orders/data/repositories/order_repository_impl.dart';
import '../../features/orders/domain/repositories/order_repository.dart';
import '../../features/orders/domain/usecases/get_orders_by_route.dart';
import '../../features/orders/domain/usecases/update_order_status.dart';
import '../../features/orders/presentation/bloc/order_bloc.dart';

final sl = GetIt.instance; // sl = Service Locator

Future<void> init() async {
  // --- Core ---
  sl.registerLazySingleton(() => const FlutterSecureStorage());

  sl.registerLazySingleton(() {
    final dio = Dio(
      BaseOptions(
        baseUrl: 'http://10.0.2.2:8081', // Backend
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
      ),
    );
    dio.interceptors.add(AuthInterceptor(localDataSource: sl()));
    return dio;
  });

  // Cliente dedicado para Auth
  sl.registerLazySingleton(() => Dio(BaseOptions(
    baseUrl: 'http://10.0.2.2:8080', // Keycloak
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  )), instanceName: 'authClient');

  // --- Features: Auth ---
  sl.registerLazySingleton<AuthRemoteDataSource>(() => AuthRemoteDataSourceImpl(
    client: sl(instanceName: 'authClient')
  ));
  sl.registerLazySingleton<AuthLocalDataSource>(() => AuthLocalDataSourceImpl(secureStorage: sl()));
  sl.registerLazySingleton<AuthRepository>(() => AuthRepositoryImpl(
    remoteDataSource: sl(), 
    localDataSource: sl()
  ));
  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerFactory(() => AuthBloc(
    loginUseCase: sl(),
    authRepository: sl()
  ));

  // --- Features: GPS ---
  sl.registerLazySingleton<GpsSensorDataSource>(() => GpsSensorDataSourceImpl());
  sl.registerLazySingleton<GpsRepository>(() => GpsRepositoryImpl(
    sensorDataSource: sl(), 
    apiClient: sl()
  ));
  sl.registerFactory(() => GpsBloc(gpsRepository: sl()));

  // --- Features: Routes ---
  sl.registerLazySingleton<RouteRemoteDataSource>(() => RouteRemoteDataSourceImpl(client: sl()));
  sl.registerLazySingleton<RouteRepository>(() => RouteRepositoryImpl(remoteDataSource: sl()));
  sl.registerLazySingleton(() => GetDriverRoutesUseCase(sl()));
  sl.registerFactory(() => RouteBloc(getDriverRoutes: sl()));

  // --- Features: Orders ---
  sl.registerLazySingleton<OrderRemoteDataSource>(() => OrderRemoteDataSourceImpl(client: sl()));
  sl.registerLazySingleton<OrderRepository>(() => OrderRepositoryImpl(remoteDataSource: sl()));
  sl.registerLazySingleton(() => GetOrdersByRouteUseCase(sl()));
  sl.registerLazySingleton(() => UpdateOrderStatusUseCase(sl()));
  sl.registerFactory(() => OrderBloc(
    getOrdersByRoute: sl(),
    updateOrderStatus: sl(),
  ));
}
