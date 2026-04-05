import 'dart:io';
import 'dart:convert';
import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/order.dart';
import '../../domain/repositories/order_repository.dart';
import '../datasources/order_remote_data_source.dart';

class OrderRepositoryImpl implements OrderRepository {
  final OrderRemoteDataSource remoteDataSource;

  OrderRepositoryImpl({required this.remoteDataSource});

  @override
  Future<Either<Failure, List<OrderEntity>>> getOrdersByRoute(int routeId) async {
    try {
      // Use the routeId query parameter to filter on the backend directly
      final orders = await remoteDataSource.getOrdersByRoute(routeId);
      return Right(orders);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Error al obtener pedidos'));
    }
  }

  @override
  Future<Either<Failure, void>> updateOrderStatus(int orderId, String status, {String? imagePath, String? signatureBase64, String? receiverName, String? receiverDni}) async {
    try {
      if (status == 'DELIVERED' && imagePath != null) {
        final bytes = await File(imagePath).readAsBytes();
        final base64Image = base64Encode(bytes);
        await remoteDataSource.createDeliveryProof(
          orderId: orderId,
          base64Image: base64Image,
          signatureBase64: signatureBase64,
          receiverName: receiverName ?? 'Cliente Final',
          receiverDni: receiverDni ?? '00000000',
        );
      } else {
        await remoteDataSource.updateOrderStatus(orderId, status);
      }
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Error al actualizar estado'));
    }
  }
}
