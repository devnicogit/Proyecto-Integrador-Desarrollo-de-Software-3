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
      final orders = await remoteDataSource.getOrders();
      final routeOrders = orders.where((o) => o.routeId == routeId).toList();
      return Right(routeOrders);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Error al obtener pedidos'));
    }
  }

  @override
  Future<Either<Failure, void>> updateOrderStatus(int orderId, String status, {String? imagePath}) async {
    try {
      if (status == 'DELIVERED' && imagePath != null) {
        final bytes = await File(imagePath).readAsBytes();
        final base64Image = base64Encode(bytes);
        // El endpoint /delivery-proofs ya actualiza el estado de la orden a DELIVERED internamente
        await remoteDataSource.createDeliveryProof(orderId, base64Image);
      } else {
        // Solo actualizamos el estado si no es una entrega exitosa con foto (que se maneja arriba)
        await remoteDataSource.updateOrderStatus(orderId, status);
      }
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Error al actualizar estado'));
    }
  }
}
