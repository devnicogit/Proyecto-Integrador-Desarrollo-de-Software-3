import 'package:dio/dio.dart';
import '../../../../core/error/exceptions.dart';
import '../models/order_model.dart';

abstract class OrderRemoteDataSource {
  Future<List<OrderModel>> getOrders();
  Future<void> updateOrderStatus(int orderId, String status);
  Future<void> createDeliveryProof(int orderId, String base64Image, {double? lat, double? lng});
}

class OrderRemoteDataSourceImpl implements OrderRemoteDataSource {
  final Dio client;

  OrderRemoteDataSourceImpl({required this.client});

  @override
  Future<List<OrderModel>> getOrders() async {
    try {
      final response = await client.get('/orders');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => OrderModel.fromJson(json)).toList();
      } else {
        throw ServerException('Error al obtener pedidos: ${response.statusCode}');
      }
    } on DioException catch (e) {
      throw ServerException('Fallo de red al obtener pedidos');
    }
  }

  @override
  Future<void> updateOrderStatus(int orderId, String status) async {
    try {
      // Usamos el mismo formato que la web: JSON con status y reason
      final response = await client.patch(
        '/orders/$orderId/status',
        data: {
          'status': status,
          'reason': 'Actualizado desde App Móvil'
        },
      );
      if (response.statusCode != 200) {
        throw ServerException('Error al actualizar estado: ${response.statusCode}');
      }
    } on DioException catch (e) {
      print('DATASOURCE: Error actualizando estado: ${e.response?.data}');
      throw ServerException('Fallo de red al actualizar estado');
    }
  }

  @override
  Future<void> createDeliveryProof(int orderId, String base64Image, {double? lat, double? lng}) async {
    try {
      print('DATASOURCE: Subiendo evidencia para pedido $orderId');
      String cleanBase64 = base64Image;
      if (cleanBase64.contains(',')) {
        cleanBase64 = cleanBase64.split(',').last;
      }

      // Formato estricto para OffsetDateTime de Java
      final now = DateTime.now().toUtc();
      final timestamp = "${now.toIso8601String().split('.').first}Z";

      final response = await client.post(
        '/delivery-proofs',
        data: {
          'orderId': orderId,
          'imageUrl': cleanBase64,
          'signatureDataUrl': '', // Dejamos vacío en lugar de 'no-signature' para evitar error de Base64
          'receiverName': 'Cliente Final',
          'receiverDni': '00000000',
          'latitude': lat ?? 0.0,
          'longitude': lng ?? 0.0,
          'verifiedAt': timestamp, 
        },
      );
      print('DATASOURCE: Status subida: ${response.statusCode}');
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw ServerException('Error al subir evidencia: ${response.statusCode}');
      }
    } on DioException catch (e) {
      print('DATASOURCE: Error Dio en subida: ${e.type}');
      print('DATASOURCE: Response data: ${e.response?.data}');
      print('DATASOURCE: Error message: ${e.message}');
      throw ServerException('Fallo de red al subir evidencia');
    } catch (e) {
      print('DATASOURCE: Error inesperado en subida: $e');
      throw ServerException('Error inesperado al procesar evidencia');
    }
  }
}
