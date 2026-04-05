import 'dart:convert';
import 'package:dio/dio.dart';
import '../../../../core/error/exceptions.dart';
import '../models/user_model.dart';

abstract class AuthRemoteDataSource {
  Future<UserModel> login(String username, String password);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  final Dio client;
  final Dio? apiClient; // Optional backend client for fetching driver info

  AuthRemoteDataSourceImpl({required this.client, this.apiClient});

  /// Decode a JWT token and extract its payload claims.
  Map<String, dynamic>? _decodeJwtPayload(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;

      String payload = parts[1];
      // Pad base64 if needed
      switch (payload.length % 4) {
        case 2:
          payload += '==';
          break;
        case 3:
          payload += '=';
          break;
      }
      final decoded = utf8.decode(base64Url.decode(payload));
      return json.decode(decoded) as Map<String, dynamic>;
    } catch (e) {
      print('JWT decode error: $e');
      return null;
    }
  }

  /// Try to fetch driver ID from backend by matching username.
  Future<String?> _fetchDriverIdFromBackend(String username) async {
    if (apiClient == null) return null;
    try {
      final response = await apiClient!.get('/drivers');
      if (response.statusCode == 200) {
        final List<dynamic> drivers = response.data;
        for (final driver in drivers) {
          final driverName = (driver['name'] ?? '').toString().toLowerCase();
          if (driverName == username.toLowerCase() ||
              driverName.contains(username.toLowerCase())) {
            return driver['id']?.toString();
          }
        }
      }
    } catch (e) {
      print('Error fetching drivers from backend: $e');
    }
    return null;
  }

  @override
  Future<UserModel> login(String username, String password) async {
    try {
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
        final responseData = response.data;
        final accessToken = responseData['access_token']?.toString() ?? '';

        // Keycloak authenticated successfully -- credentials are valid.
        // For local development, the real JWT issuer (10.0.2.2 / 192.168.1.x)
        // won't match the backend's expected issuer (localhost), so we use
        // a mock token that the backend's MockAuthFilter accepts.
        const String token = 'mock_DRIVER';

        // 1. Try to extract driver_id from JWT claims
        String? driverId;

        if (accessToken.isNotEmpty && accessToken.contains('.')) {
          final claims = _decodeJwtPayload(accessToken);
          if (claims != null) {
            driverId = claims['driver_id']?.toString() ?? claims['driverId']?.toString();
          }
        }

        // 2. If JWT didn't provide a usable numeric driver_id, try backend
        if (driverId == null || int.tryParse(driverId) == null) {
          final backendId = await _fetchDriverIdFromBackend(username);
          if (backendId != null) {
            driverId = backendId;
          }
        }

        // 3. Fallback: hardcoded mapping for known demo users
        if (driverId == null || int.tryParse(driverId) == null) {
          driverId = '1';
          if (username.toLowerCase() == 'carlos') driverId = '2';
          if (username.toLowerCase() == 'maria') driverId = '3';
          if (username.toLowerCase() == 'pedro') driverId = '4';
        }

        return UserModel(
          id: driverId,
          email: '$username@ecoroute.com',
          name: username,
          token: token,
          roles: ['DRIVER'],
        );
      } else {
        throw ServerException('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      print('--- ERROR DE AUTENTICACION ---');
      print('Status: ${e.response?.statusCode}');
      print('Data: ${e.response?.data}');
      print('Mensaje: ${e.message}');

      String errorMsg = 'Error al conectar con el servidor de identidad';
      if (e.response?.statusCode == 401 || e.response?.statusCode == 400) {
        errorMsg = 'Usuario o contrasena incorrectos';
      }
      throw ServerException(errorMsg);
    } catch (e) {
      throw ServerException('Error interno al iniciar sesion: $e');
    }
  }
}
