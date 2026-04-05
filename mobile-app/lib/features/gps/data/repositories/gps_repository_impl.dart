import 'package:dartz/dartz.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';
import '../../../../core/error/failures.dart';
import '../../domain/repositories/gps_repository.dart';
import '../datasources/gps_sensor_data_source.dart';

class GpsRepositoryImpl implements GpsRepository {
  final GpsSensorDataSource sensorDataSource;
  final Dio apiClient;

  /// Current driver and vehicle IDs, set from auth state.
  int _driverId = 1;
  int _vehicleId = 1;

  GpsRepositoryImpl({
    required this.sensorDataSource,
    required this.apiClient,
  });

  /// Update driver and vehicle IDs from the authenticated user.
  void setDriverInfo({required int driverId, int vehicleId = 1}) {
    _driverId = driverId;
    _vehicleId = vehicleId;
  }

  @override
  Future<Either<Failure, bool>> checkAndRequestPermissions() async {
    try {
      final granted = await sensorDataSource.checkAndRequestPermissions();
      return Right(granted);
    } catch (e) {
      return const Left(ServerFailure('Error al verificar permisos GPS'));
    }
  }

  @override
  Stream<Position> getLocationStream() {
    return sensorDataSource.getLocationStream();
  }

  @override
  Future<Either<Failure, void>> sendLocationToBackend(Position position) async {
    try {
      await apiClient.post('/gps/ping', data: {
        'latitude': position.latitude,
        'longitude': position.longitude,
        'speedKmh': position.speed * 3.6, // m/s to km/h
        'headingDegrees': position.heading,
        'driverId': _driverId,
        'vehicleId': _vehicleId,
      });
      return const Right(null);
    } catch (e) {
      return const Left(ServerFailure('No se pudo enviar ubicacion al servidor'));
    }
  }
}
