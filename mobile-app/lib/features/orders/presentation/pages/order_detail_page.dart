import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import '../../domain/entities/order.dart';
import '../bloc/order_bloc.dart';
import '../bloc/order_event.dart';
import '../bloc/order_state.dart';

class OrderDetailPage extends StatefulWidget {
  final OrderEntity order;

  const OrderDetailPage({super.key, required this.order});

  @override
  State<OrderDetailPage> createState() => _OrderDetailPageState();
}

class _OrderDetailPageState extends State<OrderDetailPage> {
  File? _imageEvidence;
  final ImagePicker _picker = ImagePicker();
  late String _selectedStatus;
  late bool _isReadOnly;

  final List<String> _statuses = ['PENDING', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];

  @override
  void initState() {
    super.initState();
    _selectedStatus = widget.order.status;
    // CRITICAL FIX: If status is DELIVERED or FAILED, it MUST be read-only
    _isReadOnly = _selectedStatus == 'DELIVERED' || _selectedStatus == 'FAILED';
    if (!_statuses.contains(_selectedStatus)) {
      _selectedStatus = 'PENDING';
    }
  }

  Future<void> _takePhoto() async {
    if (_isReadOnly) return;
    final XFile? photo = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
    );

    if (photo != null) {
      setState(() {
        _imageEvidence = File(photo.path);
      });
    }
  }

  void _submitDelivery() {
    if (_isReadOnly) return;
    if (_selectedStatus == 'DELIVERED' && _imageEvidence == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Se requiere una foto como evidencia para marcar como DELIVERED.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    context.read<OrderBloc>().add(
      UpdateOrderStatusEvent(
        widget.order.id, 
        _selectedStatus,
        imagePath: _imageEvidence?.path
      )
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Pedido #${widget.order.trackingNumber}'),
      ),
      body: BlocConsumer<OrderBloc, OrderState>(
        listener: (context, state) {
          if (state is OrderUpdateSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Estado actualizado exitosamente.'),
                backgroundColor: Colors.green,
              ),
            );
            context.read<OrderBloc>().add(LoadOrdersByRouteEvent(widget.order.routeId));
            Navigator.pop(context);
          } else if (state is OrderError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        builder: (context, state) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (_isReadOnly)
                  Card(
                    color: Colors.green[700],
                    child: const Padding(
                      padding: EdgeInsets.all(12.0),
                      child: Row(
                        children: [
                          Icon(Icons.lock, color: Colors.white),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'ENTREGA FINALIZADA\nEste pedido ya no puede ser modificado.', 
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 16),
                
                // 📦 Info del cliente
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Cliente: ${widget.order.recipientName}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text('Dirección: ${widget.order.deliveryAddress}'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // 🔄 Selector de Estado
                const Text('Estado del Pedido', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                DropdownButtonFormField<String>(
                  value: _selectedStatus,
                  decoration: const InputDecoration(border: OutlineInputBorder()),
                  // CRITICAL FIX: Set onChanged to null to disable the dropdown
                  onChanged: _isReadOnly ? null : (value) {
                    setState(() {
                      _selectedStatus = value!;
                    });
                  },
                  items: _statuses.map((status) {
                    return DropdownMenuItem(
                      value: status,
                      child: Text(status),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // 📸 Captura de Evidencia
                const Text('Evidencia Fotográfica', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: _isReadOnly ? null : _takePhoto,
                  child: Container(
                    height: 200,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey),
                    ),
                    child: _imageEvidence != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.file(_imageEvidence!, fit: BoxFit.cover),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.camera_alt, size: 64, color: _isReadOnly ? Colors.grey[400] : Colors.grey),
                              const SizedBox(height: 8),
                              Text(
                                _isReadOnly ? 'Evidencia guardada' : 'Tocar para abrir la cámara', 
                                style: const TextStyle(color: Colors.black54)
                              ),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: 32),

                // 🚀 Botón Guardar
                if (!_isReadOnly)
                  ElevatedButton(
                    onPressed: state is OrderUpdating ? null : _submitDelivery,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2E7D32),
                      foregroundColor: Colors.white,
                      minimumSize: const Size.fromHeight(50),
                    ),
                    child: state is OrderUpdating 
                      ? const SizedBox(
                          height: 24, width: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                        )
                      : const Text('GUARDAR ESTADO', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}
