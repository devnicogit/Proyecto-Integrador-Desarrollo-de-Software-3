import 'dart:async';
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import '../../domain/repositories/gps_repository.dart';

part 'gps_event.dart';
part 'gps_state.dart';

class GpsBloc extends Bloc<GpsEvent, GpsState> {
  final GpsRepository gpsRepository;
  StreamSubscription<Position>? _positionStreamSubscription;

  GpsBloc({required this.gpsRepository}) : super(const GpsState()) {
    on<AskGpsPermissions>(_onAskGpsPermissions);
    on<StartTracking>(_onStartTracking);
    on<StopTracking>(_onStopTracking);
    on<OnLocationUpdate>(_onLocationUpdate);
  }

  Future<void> _onAskGpsPermissions(AskGpsPermissions event, Emitter<GpsState> emit) async {
    print('GPS_BLOC: Pidiendo permisos...');
    final result = await gpsRepository.checkAndRequestPermissions();
    
    await result.fold(
      (failure) async {
        print('GPS_BLOC: Error al pedir permisos: ${failure.message}');
        emit(state.copyWith(isAllGranted: false));
      },
      (granted) async {
        print('GPS_BLOC: Permisos concedidos: $granted');
        emit(state.copyWith(isAllGranted: granted));
        if (granted) {
          try {
            print('GPS_BLOC: Obteniendo posición inicial (timeout 5s)...');
            final position = await Geolocator.getCurrentPosition(
              timeLimit: const Duration(seconds: 5),
            );
            print('GPS_BLOC: Posición inicial obtenida: ${position.latitude}');
            add(OnLocationUpdate(position));
          } catch (e) {
            print('GPS_BLOC: Timeout o error en posición inicial: $e');
            // Intentar con la última posición conocida como respaldo
            final lastPos = await Geolocator.getLastKnownPosition();
            if (lastPos != null) {
              print('GPS_BLOC: Usando última posición conocida: ${lastPos.latitude}');
              add(OnLocationUpdate(lastPos));
            }
          }
          add(StartTracking()); 
        }
      },
    );
  }

  void _onStartTracking(StartTracking event, Emitter<GpsState> emit) {
    if (!state.isAllGranted) {
      print('GPS_BLOC: No se puede iniciar tracking sin permisos');
      return;
    }

    print('GPS_BLOC: Iniciando stream de ubicación...');
    _positionStreamSubscription?.cancel();
    
    _positionStreamSubscription = gpsRepository.getLocationStream().listen((Position position) {
      print('GPS_BLOC: Nueva ubicación recibida: ${position.latitude}');
      add(OnLocationUpdate(position)); 
      gpsRepository.sendLocationToBackend(position);
    });

    emit(state.copyWith(isTracking: true));
  }

  void _onStopTracking(StopTracking event, Emitter<GpsState> emit) {
    _positionStreamSubscription?.cancel();
    emit(state.copyWith(isTracking: false));
  }

  void _onLocationUpdate(OnLocationUpdate event, Emitter<GpsState> emit) {
    emit(state.copyWith(lastKnownPosition: event.position));
  }

  @override
  Future<void> close() {
    _positionStreamSubscription?.cancel();
    return super.close();
  }
}
