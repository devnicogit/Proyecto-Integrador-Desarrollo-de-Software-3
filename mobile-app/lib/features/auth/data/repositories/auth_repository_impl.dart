import 'package:dartz/dartz.dart';
import '../../../../core/error/exceptions.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_data_source.dart';
import '../datasources/auth_remote_data_source.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final AuthLocalDataSource localDataSource;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.localDataSource,
  });

  @override
  Future<Either<Failure, User>> login(String username, String password) async {
    try {
      final userModel = await remoteDataSource.login(username, password);
      await localDataSource.cacheUser(userModel);
      return Right(userModel);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message ?? 'Error en el servidor al iniciar sesión o credenciales inválidas.'));
    } catch (e) {
      return const Left(ServerFailure('Error de conexión inesperado.'));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await localDataSource.clearCache();
      return const Right(null);
    } catch (e) {
      return const Left(CacheFailure('Error al limpiar caché local.'));
    }
  }

  @override
  Future<Either<Failure, User>> checkAuthStatus() async {
    try {
      final userModel = await localDataSource.getLastUser();
      return Right(userModel);
    } on CacheException {
      return const Left(CacheFailure('No hay sesión activa guardada.'));
    }
  }
}
