import 'package:equatable/equatable.dart';

abstract class OrderEvent extends Equatable {
  const OrderEvent();

  @override
  List<Object> get props => [];
}

class LoadOrdersByRouteEvent extends OrderEvent {
  final int routeId;

  const LoadOrdersByRouteEvent(this.routeId);

  @override
  List<Object> get props => [routeId];
}

class UpdateOrderStatusEvent extends OrderEvent {
  final int orderId;
  final String status;
  final String? imagePath;
  final String? signatureBase64;
  final String? receiverName;
  final String? receiverDni;

  const UpdateOrderStatusEvent(
    this.orderId,
    this.status, {
    this.imagePath,
    this.signatureBase64,
    this.receiverName,
    this.receiverDni,
  });

  @override
  List<Object> get props => [orderId, status, imagePath ?? '', signatureBase64 ?? '', receiverName ?? '', receiverDni ?? ''];
}
