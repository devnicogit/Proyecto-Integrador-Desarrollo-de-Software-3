import 'package:dio/dio.dart';
import '../models/delivery_history_model.dart';

abstract class HistoryRemoteDataSource {
  Future<List<DeliveryHistoryModel>> getDeliveryHistory();
}

class HistoryRemoteDataSourceImpl implements HistoryRemoteDataSource {
  final Dio client;

  HistoryRemoteDataSourceImpl({required this.client});

  @override
  Future<List<DeliveryHistoryModel>> getDeliveryHistory() async {
    try {
      final response = await client.get('/orders');
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        // Filter for DELIVERED and FAILED orders only
        final historyOrders = data
            .map((json) => DeliveryHistoryModel.fromJson(json))
            .where((order) =>
                order.status == 'DELIVERED' || order.status == 'FAILED')
            .toList();
        return historyOrders;
      } else {
        // Return empty list instead of throwing for better UX
        print('HISTORY: Unexpected status code ${response.statusCode}');
        return [];
      }
    } on DioException catch (e) {
      print('HISTORY: Network error fetching history: ${e.message}');
      return [];
    } catch (e) {
      print('HISTORY: Unexpected error: $e');
      return [];
    }
  }
}
