import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../entities/order.dart';

abstract class OrderRepository {
  Future<Either<Failure, List<OrderEntity>>> getOrdersByRoute(int routeId);
  Future<Either<Failure, void>> updateOrderStatus(int orderId, String status, {String? imagePath});
}
