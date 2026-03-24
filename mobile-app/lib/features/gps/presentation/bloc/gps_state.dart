part of 'gps_bloc.dart';

class GpsState extends Equatable {
  final bool isAllGranted;
  final bool isTracking;
  final Position? lastKnownPosition;

  const GpsState({
    this.isAllGranted = false,
    this.isTracking = false,
    this.lastKnownPosition,
  });

  GpsState copyWith({
    bool? isAllGranted,
    bool? isTracking,
    Position? lastKnownPosition,
  }) {
    return GpsState(
      isAllGranted: isAllGranted ?? this.isAllGranted,
      isTracking: isTracking ?? this.isTracking,
      lastKnownPosition: lastKnownPosition ?? this.lastKnownPosition,
    );
  }

  @override
  List<Object?> get props => [isAllGranted, isTracking, lastKnownPosition];
}
