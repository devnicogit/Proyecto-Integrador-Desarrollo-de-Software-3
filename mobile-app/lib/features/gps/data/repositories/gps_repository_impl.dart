import 'package:dartz/dartz.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';
import '../../../../core/error/failures.dart';
import '../../domain/repositories/gps_repository.dart';
import '../datasources/gps_sensor_data_source.dart';

class GpsRepositoryImpl implements GpsRepository {
  final GpsSensorDataSource sensorDataSource;
  final Dio apiClient;

  GpsRepositoryImpl({
    required this.sensorDataSource, 
    required this.apiClient
  });

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
      // 🚀 Endpoint WebFlux para el dashboard en tiempo real
      await apiClient.post('/gps/ping', data: {
        'latitude': position.latitude,
        'longitude': position.longitude,
        'speedKmh': position.speed * 3.6, // m/s to km/h
        'headingDegrees': position.heading,
        'driverId': 1, // Fallback demo driver
        'vehicleId': 1, // Fallback demo vehicle
      });
      return const Right(null);
    } catch (e) {
      return const Left(ServerFailure('No se pudo enviar ubicación al servidor'));
    }
  }
}
