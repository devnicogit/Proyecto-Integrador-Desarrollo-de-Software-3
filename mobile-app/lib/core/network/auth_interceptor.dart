import 'package:dio/dio.dart';
import '../../features/auth/data/datasources/auth_local_data_source.dart';

class AuthInterceptor extends Interceptor {
  final AuthLocalDataSource localDataSource;

  AuthInterceptor({required this.localDataSource});

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    print('INTERCEPTOR: Request a ${options.path}');
    // Si la ruta es el login, no agregamos token
    if (!options.path.contains('/auth/login') && !options.path.contains('/protocol/openid-connect/token')) {
      try {
        final user = await localDataSource.getLastUser();
        if (user.token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer ${user.token}';
          print('INTERCEPTOR: Token agregado correctamente');
        }
      } catch (e) {
        print('INTERCEPTOR: No se pudo obtener el token - $e');
      }
    }
    super.onRequest(options, handler);
  }
}
