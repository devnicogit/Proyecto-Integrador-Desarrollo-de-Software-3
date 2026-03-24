import '../../domain/entities/route.dart';

class RouteModel extends RouteEntity {
  RouteModel({
    required super.id,
    required super.driverId,
    required super.vehicleId,
    required super.routeDate,
    required super.status,
  });

  factory RouteModel.fromJson(Map<String, dynamic> json) {
    return RouteModel(
      id: json['id'] as int,
      driverId: json['driverId'] as int,
      vehicleId: json['vehicleId'] as int,
      routeDate: json['routeDate'] as String,
      status: json['status'] as String,
    );
  }
}
