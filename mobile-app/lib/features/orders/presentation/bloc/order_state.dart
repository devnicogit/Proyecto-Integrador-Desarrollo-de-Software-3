import 'package:equatable/equatable.dart';
import '../../domain/entities/order.dart';

abstract class OrderState extends Equatable {
  final List<OrderEntity> orders;
  const OrderState({this.orders = const []});

  @override
  List<Object> get props => [orders];
}

class OrderInitial extends OrderState {}

class OrderLoading extends OrderState {
  const OrderLoading({List<OrderEntity> orders = const []}) : super(orders: orders);
}

class OrderLoaded extends OrderState {
  const OrderLoaded(List<OrderEntity> orders) : super(orders: orders);
}

class OrderError extends OrderState {
  final String message;

  const OrderError(this.message, {List<OrderEntity> orders = const []}) : super(orders: orders);

  @override
  List<Object> get props => [message, orders];
}

class OrderUpdating extends OrderState {
  const OrderUpdating(List<OrderEntity> orders) : super(orders: orders);
}

class OrderUpdateSuccess extends OrderState {
  const OrderUpdateSuccess(List<OrderEntity> orders) : super(orders: orders);
}
