import 'package:dartz/dartz.dart';
import '../../../../core/error/failures.dart';
import '../repositories/order_repository.dart';

class UpdateOrderStatusUseCase {
  final OrderRepository repository;

  UpdateOrderStatusUseCase(this.repository);

  Future<Either<Failure, void>> call(
    int orderId,
    String status, {
    String? imagePath,
    String? signatureBase64,
    String? receiverName,
    String? receiverDni,
  }) async {
    return await repository.updateOrderStatus(
      orderId,
      status,
      imagePath: imagePath,
      signatureBase64: signatureBase64,
      receiverName: receiverName,
      receiverDni: receiverDni,
    );
  }
}
