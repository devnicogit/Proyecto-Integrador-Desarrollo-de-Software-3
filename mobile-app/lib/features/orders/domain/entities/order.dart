class OrderEntity {
  final int id;
  final String trackingNumber;
  final int routeId;
  final String status;
  final String recipientName;
  final String deliveryAddress;
  final double? latitude;
  final double? longitude;

  OrderEntity({
    required this.id,
    required this.trackingNumber,
    required this.routeId,
    required this.status,
    required this.recipientName,
    required this.deliveryAddress,
    this.latitude,
    this.longitude,
  });
}
