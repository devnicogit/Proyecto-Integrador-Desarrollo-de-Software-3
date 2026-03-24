import 'package:dio/dio.dart';
import '../../../../core/error/exceptions.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String username, String password);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final Dio client;

  AuthRemoteDataSourceImpl({required this.client});

  @override
  Future<UserModel> login(String username, String password) async {
    try {
      // Usamos el cliente dedicado que ya tiene la baseUrl (IP real del host)
      final response = await client.post(
        '/realms/ecoroute/protocol/openid-connect/token',
        data: {
          'client_id': 'mobile-app',
          'grant_type': 'password',
          'username': username,
          'password': password,
        },
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
        ),
      );

      if (response.statusCode == 200) {
        // Usamos un 'mock token' que el backend reconoce para darnos rol DRIVER automáticamente
        // El backend acepta tokens que empiecen por 'mock_DRIVER'
        final token = 'mock_DRIVER'; 
        
        return UserModel(
          id: '1', 
          email: '$username@ecoroute.com',
          name: username,
          token: token,
          roles: ['DRIVER'],
        );
      } else {
        throw ServerException('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      // Loggear el error detallado para ver la respuesta de Keycloak
      print('--- ERROR DE AUTENTICACIÓN ---');
      print('Status: ${e.response?.statusCode}');
      print('Data: ${e.response?.data}');
      print('Mensaje: ${e.message}');
      
      String errorMsg = 'Error al conectar con el servidor de identidad';
      if (e.response?.statusCode == 401 || e.response?.statusCode == 400) {
        errorMsg = 'Usuario o contraseña incorrectos';
      }
      throw ServerException(errorMsg);
    } catch (e) {
      throw ServerException('Error interno al iniciar sesión: $e');
    }
  }
}
