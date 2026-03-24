part of 'gps_bloc.dart';

abstract class GpsEvent extends Equatable {
  const GpsEvent();

  @override
  List<Object?> get props => [];
}

class AskGpsPermissions extends GpsEvent {}

class StartTracking extends GpsEvent {}

class StopTracking extends GpsEvent {}

class OnLocationUpdate extends GpsEvent {
  final Position position;
  const OnLocationUpdate(this.position);

  @override
  List<Object?> get props => [position];
}
