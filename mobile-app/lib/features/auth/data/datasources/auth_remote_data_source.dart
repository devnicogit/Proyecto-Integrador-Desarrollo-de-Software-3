import 'dart:convert';
import 'package:dio/dio.dart';
import '../../../../core/error/exceptions.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String username, String password);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final Dio client;       // Keycloak (autenticación)
  final Dio? apiClient;   // Backend REST (perfil de driver)

  AuthRemoteDataSourceImpl({required this.client, this.apiClient});

  /// Decode a JWT payload (claims). Devuelve null si falla.
  Map<String, dynamic>? _decodeJwtPayload(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      String payload = parts[1];
      switch (payload.length % 4) {
        case 2: payload += '=='; break;
        case 3: payload += '=';  break;
      }
      final decoded = utf8.decode(base64Url.decode(payload));
      return json.decode(decoded) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  /// Llama GET /drivers/me con el Bearer mock. Devuelve el id del driver
  /// asociado al user autenticado, o null si no hay match (404) o falla.
  Future<Map<String, dynamic>?> _fetchDriverProfile(String mockToken) async {
    if (apiClient == null) return null;
    try {
      final resp = await apiClient!.get(
        '/drivers/me',
        options: Options(headers: {'Authorization': 'Bearer $mockToken'}),
      );
      if (resp.statusCode == 200 && resp.data is Map<String, dynamic>) {
        return resp.data as Map<String, dynamic>;
      }
    } on DioException catch (e) {
      // 404 = no hay driver vinculado a ese username (Keycloak user nuevo
      // sin registro en tabla drivers); el caller decide qué hacer.
      print('[/drivers/me] ${e.response?.statusCode} ${e.message}');
    } catch (e) {
      print('[/drivers/me] error: $e');
    }
    return null;
  }

  @override
  Future<UserModel> login(String username, String password) async {
    try {
      // 1. Autenticar contra Keycloak (verifica credenciales).
      // IMPORTANTE: el body DEBE ser una String form-urlencoded, no un Map.
      // Dio con `data: Map + contentType: form-urlencoded` puede igual
      // serializar como JSON, lo que hace que Keycloak interprete la request
      // como "client-secret auth" y devuelva invalid_user_credentials aunque
      // las credenciales sean correctas.
      final body = [
        'client_id=mobile-app',
        'grant_type=password',
        'username=${Uri.encodeQueryComponent(username)}',
        'password=${Uri.encodeQueryComponent(password)}',
      ].join('&');
      final response = await client.post(
        '/realms/ecoroute/protocol/openid-connect/token',
        data: body,
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
          headers: const {'Content-Type': 'application/x-www-form-urlencoded'},
        ),
      );

      if (response.statusCode != 200) {
        throw ServerException('Error del servidor: ${response.statusCode}');
      }

      // 2. Construir el mock token con el username REAL, así el backend
      //    sabe quién es y puede resolver el driver vía /drivers/me.
      //    Formato: mock_<username>__DRIVER  (doble guion bajo separador).
      final mockToken = 'mock_${username}__DRIVER';

      // 3. Pedir al backend el driver asociado a este usuario.
      final profile = await _fetchDriverProfile(mockToken);

      // 4. Si el backend mapea OK, usamos sus datos canónicos.
      if (profile != null) {
        final driverId = profile['id']?.toString() ?? '';
        return UserModel(
          id: driverId,
          email: (profile['email'] ?? '').toString(),
          name: '${profile['firstName'] ?? username} ${profile['lastName'] ?? ''}'.trim(),
          token: mockToken,
          roles: const ['DRIVER'],
        );
      }

      // 5. Si NO hay driver vinculado, no inventamos uno. El backend
      //    devolvió 404 → el user no está dado de alta como conductor.
      //    Lanzamos un error específico para que la UI muestre el mensaje
      //    correcto en lugar de mostrar datos de un driver ajeno.
      throw ServerException(
        'No hay un conductor vinculado al usuario "$username". '
        'Pedile al administrador que cree el registro de conductor con '
        'external_id="$username" en la base de datos.',
      );
    } on DioException catch (e) {
      print('--- ERROR DE AUTENTICACION ---');
      print('Status: ${e.response?.statusCode}');
      print('Data: ${e.response?.data}');
      print('Mensaje: ${e.message}');
      String errorMsg = 'Error al conectar con el servidor de identidad';
      if (e.response?.statusCode == 401 || e.response?.statusCode == 400) {
        errorMsg = 'Usuario o contraseña incorrectos';
      }
      throw ServerException(errorMsg);
    } on ServerException {
      rethrow;
    } catch (e) {
      throw ServerException('Error interno al iniciar sesión: $e');
    }
  }
}
