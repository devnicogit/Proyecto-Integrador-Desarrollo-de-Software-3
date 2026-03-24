import 'package:flutter_bloc/flutter_bloc.dart';
import '../../domain/usecases/get_orders_by_route.dart';
import '../../domain/usecases/update_order_status.dart';
import 'order_event.dart';
import 'order_state.dart';

class OrderBloc extends Bloc<OrderEvent, OrderState> {
  final GetOrdersByRouteUseCase getOrdersByRoute;
  final UpdateOrderStatusUseCase updateOrderStatus;

  OrderBloc({
    required this.getOrdersByRoute,
    required this.updateOrderStatus,
  }) : super(OrderInitial()) {
    on<LoadOrdersByRouteEvent>((event, emit) async {
      final currentOrders = state.orders;
      emit(OrderLoading(orders: currentOrders));
      final result = await getOrdersByRoute(event.routeId);
      result.fold(
        (failure) => emit(OrderError(failure.message, orders: currentOrders)),
        (orders) => emit(OrderLoaded(orders)),
      );
    });

    on<UpdateOrderStatusEvent>((event, emit) async {
      final currentOrders = state.orders;
      emit(OrderUpdating(currentOrders));
      
      final result = await updateOrderStatus(event.orderId, event.status, imagePath: event.imagePath);
      result.fold(
        (failure) => emit(OrderError(failure.message, orders: currentOrders)),
        (success) => emit(OrderUpdateSuccess(currentOrders)),
      );
    });
  }
}
