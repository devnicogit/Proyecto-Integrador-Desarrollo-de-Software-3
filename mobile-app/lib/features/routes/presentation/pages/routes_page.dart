import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import '../../../../core/di/injection_container.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../auth/presentation/bloc/auth_event.dart';
import '../../../auth/presentation/bloc/auth_state.dart';
import '../../../orders/domain/entities/order.dart';
import '../../../gps/data/repositories/gps_repository_impl.dart';
import '../../../gps/domain/repositories/gps_repository.dart';
import '../../../gps/presentation/bloc/gps_bloc.dart';
import '../bloc/route_bloc.dart';
import '../bloc/route_event.dart';
import '../bloc/route_state.dart';
import '../../../orders/presentation/bloc/order_bloc.dart';
import '../../../orders/presentation/bloc/order_event.dart';
import '../../../orders/presentation/bloc/order_state.dart';

class RoutesPage extends StatefulWidget {
  const RoutesPage({super.key});

  @override
  State<RoutesPage> createState() => _RoutesPageState();
}

class _RoutesPageState extends State<RoutesPage> {
  final MapController _mapController = MapController();
  bool _didCenterOnFirstOrder = false;

  @override
  void initState() {
    super.initState();
    context.read<GpsBloc>().add(AskGpsPermissions());
    
    // Cargar rutas del conductor al iniciar
    final authState = context.read<AuthBloc>().state;
    if (authState is Authenticated) {
      final driverId = int.tryParse(authState.user.id) ?? 1;
      print('DEBUG: Cargando rutas para el conductor ID: $driverId');

      // Set driver info on GPS repository so location pings use the correct ID
      final gpsRepo = sl<GpsRepository>() as GpsRepositoryImpl;
      gpsRepo.setDriverInfo(driverId: driverId, vehicleId: driverId);

      context.read<RouteBloc>().add(LoadRoutesEvent(driverId));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Rutas de Hoy'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: 'Historial',
            onPressed: () => context.push('/history'),
          ),
          IconButton(
            icon: const Icon(Icons.person),
            tooltip: 'Perfil',
            onPressed: () => context.push('/profile'),
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              context.read<AuthBloc>().add(LogoutRequested());
              context.go('/login');
            },
          ),
        ],
      ),
      body: MultiBlocListener(
        listeners: [
          BlocListener<RouteBloc, RouteState>(
            listener: (context, state) {
              if (state is RouteLoaded && state.routes.isNotEmpty) {
                final firstRouteId = state.routes.first.id;
                context.read<OrderBloc>().add(LoadOrdersByRouteEvent(firstRouteId));
              }
            },
          ),
          BlocListener<GpsBloc, GpsState>(
            listener: (context, state) {
              if (state.lastKnownPosition != null) {
                final lat = state.lastKnownPosition!.latitude;
                final lng = state.lastKnownPosition!.longitude;
                if (lat < -10 && lat > -14 && lng < -75 && lng > -79) {
                  _mapController.move(LatLng(lat, lng), 15.0);
                }
              }
            },
          ),
          BlocListener<OrderBloc, OrderState>(
            listener: (context, state) {
              if (state is OrderLoaded && state.orders.isNotEmpty && !_didCenterOnFirstOrder) {
                final gpsState = context.read<GpsBloc>().state;
                if (gpsState.lastKnownPosition == null) {
                  // Bucle robusto para evitar errores de tipo
                  OrderEntity? firstPending;
                  for (final o in state.orders) {
                    if (o.status != 'DELIVERED') {
                      firstPending = o;
                      break;
                    }
                  }
                  firstPending ??= state.orders.first;
                  
                  if (firstPending.latitude != null && firstPending.longitude != null) {
                    _mapController.move(
                      LatLng(firstPending.latitude!, firstPending.longitude!), 
                      14.0
                    );
                    _didCenterOnFirstOrder = true;
                  }
                }
              }
            },
          ),
        ],
        child: Column(
          children: [
            Expanded(
              flex: 4,
              child: Container(
                color: Colors.blueGrey[100],
                child: BlocBuilder<GpsBloc, GpsState>(
                  builder: (context, gpsState) {
                    return BlocBuilder<OrderBloc, OrderState>(
                      builder: (context, orderState) {
                        const limaLatLng = LatLng(-12.046374, -77.042793);
                        LatLng centerLatLng = limaLatLng;
                        
                        if (gpsState.lastKnownPosition != null) {
                          final lat = gpsState.lastKnownPosition!.latitude;
                          final lng = gpsState.lastKnownPosition!.longitude;
                          if (lat < -10 && lat > -14 && lng < -75 && lng > -79) {
                            centerLatLng = LatLng(lat, lng);
                          }
                        } else if (orderState.orders.isNotEmpty) {
                          OrderEntity? target;
                          for (final o in orderState.orders) {
                            if (o.status != 'DELIVERED') {
                              target = o;
                              break;
                            }
                          }
                          target ??= orderState.orders.first;
                          if (target.latitude != null && target.longitude != null) {
                            centerLatLng = LatLng(target.latitude!, target.longitude!);
                          }
                        }

                        final activeOrders = orderState.orders
                            .where((o) => o.status == 'PENDING' || o.status == 'IN_TRANSIT')
                            .toList();

                        final orderMarkers = activeOrders
                            .map((o) {
                              if (o.latitude == null || o.longitude == null) return null;
                              return Marker(
                                point: LatLng(o.latitude!, o.longitude!),
                                width: 40,
                                height: 40,
                                child: GestureDetector(
                                  onTap: () {
                                    context.push('/orders/${o.id}', extra: o);
                                  },
                                  child: Icon(
                                    Icons.location_on,
                                    color: o.status == 'IN_TRANSIT' ? Colors.orange : Colors.red,
                                    size: 35,
                                  ),
                                ),
                              );
                            })
                            .whereType<Marker>()
                            .toList();

                        final routePoints = activeOrders
                            .where((o) => o.latitude != null && o.longitude != null)
                            .map((o) => LatLng(o.latitude!, o.longitude!))
                            .toList();

                        return Stack(
                          children: [
                            FlutterMap(
                              mapController: _mapController,
                              options: MapOptions(
                                initialCenter: centerLatLng,
                                initialZoom: 13.0,
                              ),
                              children: [
                                TileLayer(
                                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                  userAgentPackageName: 'com.ecoroute.driver',
                                ),
                                if (routePoints.length > 1)
                                  PolylineLayer(
                                    polylines: [
                                      Polyline(
                                        points: routePoints,
                                        color: Colors.blueAccent.withOpacity(0.9),
                                        strokeWidth: 8.0,
                                        borderColor: Colors.blue[900],
                                        borderStrokeWidth: 3.0,
                                      ),
                                    ],
                                  ),
                                MarkerLayer(
                                  markers: [
                                    if (gpsState.lastKnownPosition != null)
                                      Marker(
                                        point: LatLng(gpsState.lastKnownPosition!.latitude, gpsState.lastKnownPosition!.longitude),
                                        width: 60,
                                        height: 60,
                                        child: const Icon(Icons.local_shipping, color: Colors.blue, size: 40),
                                      ),
                                    ...orderMarkers,
                                  ],
                                ),
                              ],
                            ),
                            Positioned(
                              bottom: 16,
                              right: 16,
                              child: FloatingActionButton.small(
                                heroTag: 'gps_btn',
                                onPressed: () => context.read<GpsBloc>().add(AskGpsPermissions()),
                                child: const Icon(Icons.my_location),
                              ),
                            ),
                          ],
                        );
                      },
                    );
                  },
                ),
              ),
            ),
            Expanded(
              flex: 6,
              child: Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)),
                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -5))],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    BlocBuilder<RouteBloc, RouteState>(
                      builder: (context, routeState) {
                        return BlocBuilder<OrderBloc, OrderState>(
                          builder: (context, orderState) {
                            int count = 0;
                            if (orderState is OrderLoaded) count = orderState.orders.length;
                            String statusText = 'Entregas Pendientes ($count)';
                            if (routeState is RouteLoading) statusText = 'Cargando Rutas...';
                            return Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (routeState is RouteLoaded && routeState.routes.length > 1)
                                    DropdownButton<int>(
                                      value: orderState.orders.isNotEmpty ? orderState.orders.first.routeId : routeState.routes.first.id,
                                      isExpanded: true,
                                      items: routeState.routes.map((r) => DropdownMenuItem(value: r.id, child: Text('Ruta #${r.id} - ${r.routeDate}'))).toList(),
                                      onChanged: (val) {
                                        if (val != null) {
                                          context.read<OrderBloc>().add(LoadOrdersByRouteEvent(val));
                                          setState(() => _didCenterOnFirstOrder = false);
                                        }
                                      },
                                    ),
                                  Text(statusText, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                                ],
                              ),
                            );
                          },
                        );
                      },
                    ),
                    Expanded(
                      child: BlocBuilder<RouteBloc, RouteState>(
                        builder: (context, routeState) {
                          if (routeState is RouteLoading) return const Center(child: CircularProgressIndicator());
                          if (routeState is RouteError) {
                            return Center(
                              child: Padding(
                                padding: const EdgeInsets.all(24.0),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(Icons.cloud_off, size: 64, color: Colors.grey),
                                    const SizedBox(height: 16),
                                    Text(
                                      'Error al cargar rutas: ${routeState.message}',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(color: Colors.red),
                                    ),
                                    const SizedBox(height: 16),
                                    ElevatedButton.icon(
                                      onPressed: () {
                                        final authState = context.read<AuthBloc>().state;
                                        if (authState is Authenticated) {
                                          final driverId = int.tryParse(authState.user.id) ?? 1;
                                          context.read<RouteBloc>().add(LoadRoutesEvent(driverId));
                                        }
                                      },
                                      icon: const Icon(Icons.refresh),
                                      label: const Text('Reintentar'),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }
                          if (routeState is RouteLoaded && routeState.routes.isEmpty) {
                            return Center(
                              child: Padding(
                                padding: const EdgeInsets.all(24.0),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.route, size: 64, color: Colors.grey[400]),
                                    const SizedBox(height: 16),
                                    const Text(
                                      'No tienes rutas asignadas para hoy',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(fontSize: 16, color: Colors.grey),
                                    ),
                                    const SizedBox(height: 8),
                                    const Text(
                                      'Las rutas se asignan diariamente. Consulta con tu supervisor.',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(fontSize: 13, color: Colors.grey),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }
                          return BlocBuilder<OrderBloc, OrderState>(
                            builder: (context, state) {
                              if (state is OrderLoading && state.orders.isEmpty) return const Center(child: CircularProgressIndicator());
                              final orders = state.orders;
                              if (orders.isEmpty) {
                                return Center(
                                  child: Padding(
                                    padding: const EdgeInsets.all(24.0),
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey[400]),
                                        const SizedBox(height: 16),
                                        const Text(
                                          'No hay pedidos en esta ruta',
                                          textAlign: TextAlign.center,
                                          style: TextStyle(fontSize: 16, color: Colors.grey),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }
                              return ListView.builder(
                                itemCount: orders.length,
                                itemBuilder: (context, index) {
                                  final order = orders[index];
                                  return ListTile(
                                    leading: CircleAvatar(backgroundColor: Colors.green.withOpacity(0.2), child: const Icon(Icons.location_on, color: Colors.green)),
                                    title: Text('Pedido #${order.trackingNumber} - ${order.status}'),
                                    subtitle: Text('${order.recipientName}\n${order.deliveryAddress}'),
                                    trailing: const Icon(Icons.chevron_right),
                                    onTap: () => context.push('/orders/${order.id}', extra: order),
                                  );
                                },
                              );
                            },
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
