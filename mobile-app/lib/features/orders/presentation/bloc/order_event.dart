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
  final String? imagePath; // Para la evidencia (Phase 3)

  const UpdateOrderStatusEvent(this.orderId, this.status, {this.imagePath});

  @override
  List<Object> get props => [orderId, status, imagePath ?? ''];
}
