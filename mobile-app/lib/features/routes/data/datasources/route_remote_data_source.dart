import 'package:dio/dio.dart';
import '../../../../core/error/exceptions.dart';
import '../models/route_model.dart';

abstract class RouteRemoteDataSource {
  Future<List<RouteModel>> getRoutes();
}

class RouteRemoteDataSourceImpl implements RouteRemoteDataSource {
  final Dio client;

  RouteRemoteDataSourceImpl({required this.client});

  @override
  Future<List<RouteModel>> getRoutes() async {
    try {
      print('DATASOURCE: Obteniendo rutas de ${client.options.baseUrl}/routes');
      final response = await client.get('/routes');
      print('DATASOURCE: Status ${response.statusCode}');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        print('DATASOURCE: ${data.length} rutas recibidas');
        return data.map((json) => RouteModel.fromJson(json)).toList();
      } else {
        print('DATASOURCE: Error del servidor ${response.statusCode}');
        throw ServerException('Error del servidor: ${response.statusCode}');
      }
    } on DioException catch (e) {
      print('DATASOURCE: DioException - ${e.type} - ${e.message}');
      print('DATASOURCE: Response: ${e.response?.data}');
      throw ServerException('No se pudo conectar con el servidor de rutas');
    }
  }
}
