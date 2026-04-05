import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Simplified offline cache using FlutterSecureStorage.
/// Caches orders and pending delivery proofs for offline support.
class LocalCache {
  final FlutterSecureStorage _storage;

  static const String _ordersKey = 'CACHED_ORDERS';
  static const String _pendingProofsKey = 'PENDING_PROOFS';

  LocalCache({required FlutterSecureStorage storage}) : _storage = storage;

  // --- Orders cache ---

  Future<void> cacheOrders(int routeId, List<Map<String, dynamic>> orders) async {
    final key = '${_ordersKey}_$routeId';
    await _storage.write(key: key, value: json.encode(orders));
  }

  Future<List<Map<String, dynamic>>> getCachedOrders(int routeId) async {
    final key = '${_ordersKey}_$routeId';
    final data = await _storage.read(key: key);
    if (data != null) {
      final List<dynamic> decoded = json.decode(data);
      return decoded.cast<Map<String, dynamic>>();
    }
    return [];
  }

  // --- Pending delivery proofs queue ---

  Future<void> cachePendingProof(Map<String, dynamic> proof) async {
    final existing = await getPendingProofs();
    existing.add(proof);
    await _storage.write(key: _pendingProofsKey, value: json.encode(existing));
  }

  Future<List<Map<String, dynamic>>> getPendingProofs() async {
    final data = await _storage.read(key: _pendingProofsKey);
    if (data != null) {
      final List<dynamic> decoded = json.decode(data);
      return decoded.cast<Map<String, dynamic>>();
    }
    return [];
  }

  Future<void> clearPendingProof(int orderId) async {
    final existing = await getPendingProofs();
    existing.removeWhere((proof) => proof['orderId'] == orderId);
    await _storage.write(key: _pendingProofsKey, value: json.encode(existing));
  }

  Future<void> clearAllPendingProofs() async {
    await _storage.delete(key: _pendingProofsKey);
  }
}
