class User {
  final String id;
  final String email;
  final String name;
  final String token;
  final List<String> roles;

  User({
    required this.id,
    required this.email,
    required this.name,
    required this.token,
    required this.roles,
  });
}
